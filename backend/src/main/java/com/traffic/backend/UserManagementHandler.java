package com.traffic.backend;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class UserManagementHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        enableCORS(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(200, 0);
            OutputStream os = exchange.getResponseBody();
            os.close();
            return;
        }

        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.contains("TOKEN-ADMIN-")) {
            sendResponse(exchange, 403, "{\"error\":\"Forbidden: Admin access required\"}");
            return;
        }

        String method = exchange.getRequestMethod();
        if ("GET".equalsIgnoreCase(method)) {
            handleGetUsers(exchange);
        } else if ("POST".equalsIgnoreCase(method)) {
            handleAddUser(exchange);
        } else if ("PUT".equalsIgnoreCase(method)) {
            handleUpdatePassword(exchange);
        } else if ("DELETE".equalsIgnoreCase(method)) {
            handleDeleteUser(exchange);
        } else {
            sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    private void handleGetUsers(HttpExchange exchange) throws IOException {
        List<Map<String, Object>> users = DatabaseManager.getAllUsers();
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < users.size(); i++) {
            Map<String, Object> u = users.get(i);
            sb.append(String.format(
                "{\"id\":%d,\"username\":\"%s\",\"password\":\"%s\",\"role\":\"%s\",\"created_at\":\"%s\"}",
                u.get("id"),
                escapeJson((String) u.get("username")),
                escapeJson((String) u.get("password")),
                escapeJson((String) u.get("role")),
                escapeJson((String) u.get("created_at"))
            ));
            if (i < users.size() - 1) sb.append(",");
        }
        sb.append("]");
        sendResponse(exchange, 200, sb.toString());
    }

    private void handleAddUser(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

        String username = extractJsonField(body, "username");
        String password = extractJsonField(body, "password");
        String role = extractJsonField(body, "role");

        if (role == null || role.isEmpty()) role = "user";

        if (username == null || password == null || username.isEmpty() || password.isEmpty()) {
            sendResponse(exchange, 400, "{\"error\":\"Username and password are required\"}");
            return;
        }

        boolean success = DatabaseManager.addUser(username, password, role);
        if (success) {
            sendResponse(exchange, 201, "{\"success\":true,\"message\":\"User added successfully\"}");
        } else {
            sendResponse(exchange, 400, "{\"error\":\"Failed to add user. Username may already exist.\"}");
        }
    }

    private void handleUpdatePassword(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

        String idStr = extractJsonFieldRaw(body, "id");
        String newPassword = extractJsonField(body, "password");

        if (idStr == null || newPassword == null || newPassword.isEmpty()) {
            sendResponse(exchange, 400, "{\"error\":\"User ID and new password are required\"}");
            return;
        }

        try {
            int id = Integer.parseInt(idStr);
            boolean success = DatabaseManager.updateUserPassword(id, newPassword);
            if (success) {
                sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Password updated successfully\"}");
            } else {
                sendResponse(exchange, 404, "{\"error\":\"User not found\"}");
            }
        } catch (NumberFormatException e) {
            sendResponse(exchange, 400, "{\"error\":\"Invalid User ID\"}");
        }
    }

    private void handleDeleteUser(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        if (query != null && query.contains("id=")) {
            String idStr = query.substring(query.indexOf("id=") + 3);
            if (idStr.contains("&")) idStr = idStr.substring(0, idStr.indexOf("&"));
            try {
                int id = Integer.parseInt(idStr);
                boolean success = DatabaseManager.deleteUser(id);
                if (success) {
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"User deleted successfully\"}");
                } else {
                    sendResponse(exchange, 404, "{\"error\":\"User not found\"}");
                }
            } catch (NumberFormatException e) {
                sendResponse(exchange, 400, "{\"error\":\"Invalid User ID\"}");
            }
        } else {
            sendResponse(exchange, 400, "{\"error\":\"User ID query parameter required\"}");
        }
    }

    private String extractJsonField(String json, String key) {
        if (json == null) return null;
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start != -1) {
            start += pattern.length();
            int end = json.indexOf("\"", start);
            if (end != -1) {
                return json.substring(start, end);
            }
        }
        return null;
    }

    private String extractJsonFieldRaw(String json, String key) {
        if (json == null) return null;
        String pattern = "\"" + key + "\":";
        int start = json.indexOf(pattern);
        if (start != -1) {
            start += pattern.length();
            while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '"')) {
                start++;
            }
            int end = start;
            while (end < json.length() && Character.isDigit(json.charAt(end))) {
                end++;
            }
            if (end > start) {
                return json.substring(start, end);
            }
        }
        return null;
    }

    private void enableCORS(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
