import axios from "axios";
import http from "node:http";
import https from "node:https";

// Không cấu hình agent keep-alive khiến MỌI lệnh gọi HTTP tới backend (lưu
// tin nhắn chat, lấy lịch sử, tra cứu người thân/chuyên khoa, đặt lịch...)
// phải bắt tay TCP/TLS lại từ đầu mỗi lần — đo thực tế trên deploy cho thấy
// chi phí này chiếm ~1.3-1.8s mỗi lệnh gọi, gần như cố định bất kể nội
// dung, lớn hơn cả bản thân lệnh gọi LLM. Dùng chung 1 axios instance với
// keep-alive để tái sử dụng kết nối TCP/TLS giữa các request thay vì thiết
// lập lại từ đầu.
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const httpClient = axios.create({
  httpAgent,
  httpsAgent,
});

export default httpClient;
