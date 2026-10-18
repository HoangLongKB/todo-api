/**
 * Apps Script gắn vào Google Sheet "Todo Sheet (demo)". Cột A:id, B:title, C:done.
 * Bí mật KHÔNG nằm trong file này. Vào Project Settings -> Script Properties, đặt:
 *   API_BASE_URL   ví dụ https://todo-api-xxxx.a.run.app/api/v1 (local không gọi được từ GAS)
 *   WEBHOOK_SECRET  trùng với WEBHOOK_SECRET của API
 *   OWNER_UID       uid Firebase của người dùng (Firebase console -> Authentication -> Users)
 * Bản gốc file này nằm trong repo todo-api/gas/Code.gs để có lịch sử sửa đổi.
 */

var SHEET_NAME = 'Todos';

/** Chạy mỗi khi mở sheet: thêm menu "Todo" lên thanh công cụ. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Todo')
    .addItem('Push lên API', 'pushTodos')
    .addItem('Pull từ API', 'pullTodos')
    .addToUi();
}

/** Đọc một Script Property, thiếu thì báo rõ tên thay vì lỗi khó hiểu. */
function cfg_(key) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v) throw new Error('Thiếu Script Property: ' + key);
  return v;
}

/**
 * Gọi API một lần. muteHttpExceptions=true để tự đọc mã lỗi thay vì GAS ném exception
 * chung chung. Trả về phần data (API bọc { success, data }).
 */
function api_(method, path, payload) {
  var res = UrlFetchApp.fetch(cfg_('API_BASE_URL') + path, {
    method: method,
    contentType: 'application/json',
    headers: { 'x-webhook-secret': cfg_('WEBHOOK_SECRET') },
    payload: payload ? JSON.stringify(payload) : undefined,
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code >= 400) throw new Error('API trả ' + code + ': ' + text.slice(0, 300));
  return JSON.parse(text).data;
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(['id', 'title', 'done']);
  return sh;
}

/** Sheet -> API. Dòng có id thì cập nhật, không id thì tạo mới. Rồi pull lại để lấy id mới. */
function pushTodos() {
  var sh = sheet_();
  var last = sh.getLastRow();
  var items = [];
  if (last >= 2) {
    var rows = sh.getRange(2, 1, last - 1, 3).getValues();
    rows.forEach(function (r) {
      var title = String(r[1] || '').trim();
      if (!title) return; // dòng trống bỏ qua
      var item = { title: title, done: r[2] === true || String(r[2]).toUpperCase() === 'TRUE' };
      if (r[0]) item.id = String(r[0]);
      items.push(item);
    });
  }
  if (items.length === 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Sheet trống, không có gì để push');
    return;
  }

  var acc = api_('post', '/webhook/todos/import', { ownerUid: cfg_('OWNER_UID'), items: items });
  // 202: API mới NHẬN, chưa làm xong. Hỏi lại trạng thái tối đa 15 lần, mỗi lần cách 1 giây.
  var job = null;
  for (var i = 0; i < 15; i++) {
    Utilities.sleep(1000);
    job = api_('get', '/jobs/' + acc.jobId);
    if (job.status === 'done' || job.status === 'failed') break;
  }
  if (!job || job.status !== 'done') {
    throw new Error('Job ' + acc.jobId + ' trạng thái ' + (job ? job.status : '?') + (job && job.error ? ': ' + job.error : ''));
  }
  var r = job.result;
  pullTodos();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Tạo ' + r.created + ', cập nhật ' + r.updated + ', không tìm thấy ' + r.notFound.length,
    'Push xong'
  );
}

/** API -> Sheet. Ghi đè toàn bộ dòng dữ liệu bằng danh sách mới nhất. */
function pullTodos() {
  var data = api_('get', '/webhook/todos?ownerUid=' + encodeURIComponent(cfg_('OWNER_UID')) + '&limit=100');
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, 3).clearContent();
  var rows = data.items.map(function (t) {
    return [t.id, t.title, t.done];
  });
  if (rows.length > 0) sh.getRange(2, 1, rows.length, 3).setValues(rows);
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã kéo ' + rows.length + ' todo', 'Pull xong');
}

/* ===================== Chiều ngược: API GỌI GAS ===================== */
/**
 * Để nhận được request, script phải Deploy -> New deployment -> Web app
 * (Execute as: Me; Who has access: Anyone). URL /exec sinh ra đặt vào GAS_WEBAPP_URL của API.
 * Script Property cần thêm: API_SECRET (trùng GAS_WEBAPP_SECRET của API).
 * doPost KHÔNG đọc được header, nên secret nằm trong body JSON.
 */
var EXPORT_SHEET = 'Export';

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!body.secret || body.secret !== cfg_('API_SECRET')) {
      return json_({ ok: false, error: 'secret sai' });
    }
    if (body.action !== 'exportTodos') {
      return json_({ ok: false, error: 'action không hỗ trợ: ' + body.action });
    }
    var written = writeExport_(body.ownerUid, body.items || []);
    return json_({ ok: true, written: written, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/** Ghi đè tab Export: hàng 1 tiêu đề, từ hàng 2 là dữ liệu. Trả số dòng đã ghi. */
function writeExport_(ownerUid, items) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(EXPORT_SHEET) || ss.insertSheet(EXPORT_SHEET);
  sh.clearContents();
  sh.getRange(1, 1, 1, 5).setValues([['id', 'title', 'done', 'ownerUid', 'exportedAt']]);
  if (items.length === 0) return 0;
  var now = new Date().toISOString();
  var rows = items.map(function (t) {
    return [t.id, t.title, t.done === true, ownerUid, now];
  });
  sh.getRange(2, 1, rows.length, 5).setValues(rows);
  return rows.length;
}

/** Trả JSON đúng kiểu để client parse được (mặc định GAS trả HTML). */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
