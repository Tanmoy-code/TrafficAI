package com.traffic.backend;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

public class AuthHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        enableCORS(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(200, 0);
            OutputStream os = exchange.getResponseBody();
            os.close();
            return;
        }

        String path = exchange.getRequestURI().getPath();

        if (path.endsWith("/login") && "POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            handleLogin(exchange);
        } else if (path.endsWith("/verify") && ("GET".equalsIgnoreCase(exchange.getRequestMethod()) || "POST".equalsIgnoreCase(exchange.getRequestMethod()))) {
            handleVerify(exchange);
        } else {
            sendResponse(exchange, 404, "{\"error\":\"Endpoint not found\"}");
        }
    }

    private void handleLogin(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

        String username = extractJsonField(body, "username");
        String password = extractJsonField(body, "password");

        if (username == null || password == null || username.isEmpty() || password.isEmpty()) {
            sendResponse(exchange, 400, "{\"error\":\"Username and password are required\"}");
            return;
        }

        Map<String, Object> user = DatabaseManager.authenticateUser(username, password);
        if (user != null) {
            String role = (String) user.get("role");
            int id = (int) user.get("id");
            String token = "TOKEN-" + role.toUpperCase() + "-" + id + "-" + UUID.randomUUID().toString();

            String response = String.format(
                "{\"success\":true,\"token\":\"%s\",\"user\":{\"id\":%d,\"username\":\"%s\",\"role\":\"%s\"}}",
                token, id, escapeJson(username), escapeJson(role)
            );
            sendResponse(exchange, 200, response);
        } else {
            sendResponse(exchange, 401, "{\"error\":\"Invalid username or password\"}");
        }
    }

    private void handleVerify(HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer TOKEN-")) {
            sendResponse(exchange, 200, "{\"valid\":true}");
        } else {
            sendResponse(exchange, 401, "{\"valid\":false}");
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

    private void enableCORS(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
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
