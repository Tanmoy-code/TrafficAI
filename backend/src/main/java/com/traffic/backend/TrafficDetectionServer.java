package com.traffic.backend;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;

public class TrafficDetectionServer {

    private static final int PORT = 5000;

    public static void main(String[] args) throws IOException {
        DatabaseManager.initDatabase();

        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", PORT), 0);

        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/settings", new SettingsHandler());
        server.createContext("/api/detect", new DetectHandler());
        server.createContext("/api/history", new HistoryHandler());
        server.createContext("/api/auth", new AuthHandler());
        server.createContext("/api/users", new UserManagementHandler());

        server.setExecutor(Executors.newFixedThreadPool(10));
        System.out.println("==================================================");
        System.out.println("🚀 Traffic Detection Java Backend Service Running!");
        System.out.println("PORT          : " + PORT);
        System.out.println("HEALTH CHECK  : http://localhost:" + PORT + "/api/health");
        System.out.println("AUTH ENDPT    : http://localhost:" + PORT + "/api/auth/login");
        System.out.println("USERS ENDPT   : http://localhost:" + PORT + "/api/users");
        System.out.println("HISTORY ENDPT : http://localhost:" + PORT + "/api/history");
        System.out.println("==================================================");
        server.start();
    }

    private static File getHistoryDir() {
        File dir = new File("history");
        if (!dir.exists()) {
            File alt = new File("backend/history");
            if (alt.getParentFile() != null && alt.getParentFile().exists()) {
                dir = alt;
            }
        }
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    private static void enableCORS(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            enableCORS(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String response = "{\"status\":\"UP\",\"port\":" + PORT + ",\"service\":\"Traffic Detection Java API\"}";
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }

    static class SettingsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            enableCORS(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String response = "{\"yolo_conf\":0.30,\"motion_threshold\":0.90,\"padding_percent\":0.15,\"min_crop_px\":120}";
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }

    static class HistoryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            enableCORS(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String method = exchange.getRequestMethod();
            if ("GET".equalsIgnoreCase(method)) {
                File dir = getHistoryDir();
                File[] files = dir.listFiles((d, name) -> name.endsWith(".json"));
                StringBuilder sb = new StringBuilder("[");
                if (files != null && files.length > 0) {
                    Arrays.sort(files, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
                    for (int i = 0; i < files.length; i++) {
                        try {
                            String content = Files.readString(files[i].toPath(), StandardCharsets.UTF_8);
                            sb.append(content);
                            if (i < files.length - 1) {
                                sb.append(",");
                            }
                        } catch (Exception ex) {
                            ex.printStackTrace();
                        }
                    }
                }
                sb.append("]");
                byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().add("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, bytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(bytes);
                os.close();
            } else if ("DELETE".equalsIgnoreCase(method)) {
                String query = exchange.getRequestURI().getQuery();
                File dir = getHistoryDir();
                if (query != null && query.contains("id=")) {
                    String id = query.substring(query.indexOf("id=") + 3);
                    if (id.contains("&")) id = id.substring(0, id.indexOf("&"));
                    File file = new File(dir, id + ".json");
                    if (file.exists()) {
                        file.delete();
                    }
                } else {
                    File[] files = dir.listFiles((d, name) -> name.endsWith(".json"));
                    if (files != null) {
                        for (File f : files) f.delete();
                    }
                }
                String resp = "{\"status\":\"success\"}";
                byte[] bytes = resp.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().add("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, bytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(bytes);
                os.close();
            } else {
                sendError(exchange, 405, "Method Not Allowed");
            }
        }
    }

    static class DetectHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            enableCORS(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendError(exchange, 405, "Method Not Allowed");
                return;
            }

            try {
                String contentType = exchange.getRequestHeaders().getFirst("Content-Type");
                if (contentType == null || !contentType.startsWith("multipart/form-data")) {
                    sendError(exchange, 400, "Content-Type must be multipart/form-data");
                    return;
                }

                String boundary = contentType.substring(contentType.indexOf("boundary=") + 9);
                if (boundary.startsWith("\"") && boundary.endsWith("\"")) {
                    boundary = boundary.substring(1, boundary.length() - 1);
                }

                InputStream is = exchange.getRequestBody();
                byte[] requestBytes = is.readAllBytes();

                File tempImage = File.createTempFile("traffic_upload_", ".jpg");
                tempImage.deleteOnExit();

                Map<String, String> formParams = extractMultipartData(requestBytes, boundary, tempImage);

                String yoloConf = formParams.getOrDefault("yolo_conf", "0.30");
                String motionThreshold = formParams.getOrDefault("motion_threshold", "0.90");
                String paddingPercent = formParams.getOrDefault("padding_percent", "0.15");
                String minCropPx = formParams.getOrDefault("min_crop_px", "120");
                String originalFilename = formParams.getOrDefault("filename", "Traffic_Surveillance.jpg");

                String pythonCmd = System.getProperty("os.name").toLowerCase().contains("win") ? "python" : "python3";

                File currentDir = new File(".").getCanonicalFile();
                File scriptFile = new File(currentDir, "python_pipeline/pipeline.py");
                if (!scriptFile.exists()) {
                    scriptFile = new File(currentDir, "backend/python_pipeline/pipeline.py");
                }

                ProcessBuilder pb = new ProcessBuilder(
                        pythonCmd,
                        scriptFile.getAbsolutePath(),
                        "--input", tempImage.getAbsolutePath(),
                        "--yolo_conf", yoloConf,
                        "--motion_threshold", motionThreshold,
                        "--padding_percent", paddingPercent,
                        "--min_crop_px", minCropPx
                );

                pb.redirectErrorStream(false);
                Process process = pb.start();

                BufferedReader stdoutReader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
                BufferedReader stderrReader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8));

                StringBuilder jsonOutput = new StringBuilder();
                String line;
                while ((line = stdoutReader.readLine()) != null) {
                    jsonOutput.append(line);
                }

                StringBuilder errOutput = new StringBuilder();
                while ((line = stderrReader.readLine()) != null) {
                    errOutput.append(line).append("\n");
                }

                int exitCode = process.waitFor();
                tempImage.delete();

                String rawStr = jsonOutput.toString();
                int firstBrace = rawStr.indexOf('{');
                int lastBrace = rawStr.lastIndexOf('}');
                if (firstBrace != -1 && lastBrace != -1 && lastBrace >= firstBrace) {
                    rawStr = rawStr.substring(firstBrace, lastBrace + 1);
                }

                if (exitCode != 0 || rawStr.isEmpty() || !rawStr.startsWith("{")) {
                    System.err.println("Python error: " + errOutput.toString());
                    sendError(exchange, 500, "Detection processing failed: " + errOutput.toString());
                    return;
                }

                // Inject run metadata (run_id, timestamp, filename) and persist to history
                String runId = UUID.randomUUID().toString();
                String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                String metaFields = "\"run_id\":\"" + runId + "\",\"timestamp\":\"" + timestamp + "\",\"filename\":\"" + escapeJson(originalFilename) + "\",";
                rawStr = "{" + metaFields + rawStr.substring(1);

                try {
                    File historyFile = new File(getHistoryDir(), runId + ".json");
                    Files.writeString(historyFile.toPath(), rawStr, StandardCharsets.UTF_8);
                } catch (Exception ex) {
                    System.err.println("Failed to write history file: " + ex.getMessage());
                }

                byte[] responseBytes = rawStr.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().add("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, responseBytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(responseBytes);
                os.close();

            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, "Internal Server Error: " + e.getMessage());
            }
        }

        private Map<String, String> extractMultipartData(byte[] data, String boundary, File tempImage) throws IOException {
            Map<String, String> params = new HashMap<>();
            byte[] boundaryBytes = ("--" + boundary).getBytes(StandardCharsets.UTF_8);
            
            int pos = 0;
            while (pos < data.length) {
                int nextBoundary = indexOf(data, boundaryBytes, pos);
                if (nextBoundary == -1) break;
                
                int partStart = pos;
                int partEnd = nextBoundary;
                pos = nextBoundary + boundaryBytes.length;
                
                if (partStart == 0) continue;
                
                int headerEnd = indexOf(data, "\r\n\r\n".getBytes(StandardCharsets.UTF_8), partStart);
                if (headerEnd == -1 || headerEnd > partEnd) continue;
                
                String headers = new String(data, partStart, headerEnd - partStart, StandardCharsets.UTF_8);
                int contentStart = headerEnd + 4;
                int contentEnd = partEnd - 2;
                
                if (contentEnd < contentStart) continue;
                
                if (headers.contains("filename=")) {
                    int fnIdx = headers.indexOf("filename=");
                    if (fnIdx != -1) {
                        String sub = headers.substring(fnIdx + 9);
                        if (sub.startsWith("\"")) {
                            sub = sub.substring(1);
                            int endQ = sub.indexOf("\"");
                            if (endQ != -1) sub = sub.substring(0, endQ);
                        } else {
                            int endSp = sub.indexOf("\r\n");
                            if (endSp != -1) sub = sub.substring(0, endSp);
                        }
                        params.put("filename", sub.trim());
                    }
                    FileOutputStream fos = new FileOutputStream(tempImage);
                    fos.write(data, contentStart, contentEnd - contentStart);
                    fos.close();
                } else if (headers.contains("name=")) {
                    int nameIdx = headers.indexOf("name=\"") + 6;
                    int endNameIdx = headers.indexOf("\"", nameIdx);
                    if (nameIdx > 5 && endNameIdx > nameIdx) {
                        String fieldName = headers.substring(nameIdx, endNameIdx);
                        String fieldValue = new String(data, contentStart, contentEnd - contentStart, StandardCharsets.UTF_8).trim();
                        params.put(fieldName, fieldValue);
                    }
                }
            }
            return params;
        }

        private int indexOf(byte[] outer, byte[] target, int fromIndex) {
            for (int i = fromIndex; i <= outer.length - target.length; i++) {
                boolean match = true;
                for (int j = 0; j < target.length; j++) {
                    if (outer[i + j] != target[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) return i;
            }
            return -1;
        }
    }

    private static String escapeJson(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char ch = input.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                default:
                    if (ch < ' ') {
                        String hex = Integer.toHexString(ch);
                        sb.append("\\u");
                        for (int k = 0; k < 4 - hex.length(); k++) sb.append('0');
                        sb.append(hex);
                    } else {
                        sb.append(ch);
                    }
                    break;
            }
        }
        return sb.toString();
    }

    private static void sendError(HttpExchange exchange, int code, String message) throws IOException {
        String jsonErr = "{\"error\":\"" + escapeJson(message) + "\"}";
        byte[] bytes = jsonErr.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(code, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }
}
