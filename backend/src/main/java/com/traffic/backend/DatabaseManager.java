package com.traffic.backend;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DatabaseManager {

    private static final String SQLITE_URL = "jdbc:sqlite:users.db";
    private static final File JSON_DB_FILE = new File("users_db.json");
    private static boolean useFileFallback = false;

    public static void initDatabase() {
        try {
            String dbUrl = System.getenv("DB_URL");
            if (dbUrl == null || dbUrl.isEmpty()) {
                Class.forName("org.sqlite.JDBC");
            } else if (dbUrl.contains("mysql")) {
                Class.forName("com.mysql.cj.jdbc.Driver");
            }
            
            try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
                String createTableSql = "CREATE TABLE IF NOT EXISTS users ("
                        + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                        + "username VARCHAR(50) UNIQUE NOT NULL, "
                        + "password VARCHAR(100) NOT NULL, "
                        + "role VARCHAR(20) NOT NULL, "
                        + "created_at VARCHAR(30) NOT NULL"
                        + ");";

                if (dbUrl != null && dbUrl.contains("mysql")) {
                    createTableSql = "CREATE TABLE IF NOT EXISTS users ("
                            + "id INT AUTO_INCREMENT PRIMARY KEY, "
                            + "username VARCHAR(50) UNIQUE NOT NULL, "
                            + "password VARCHAR(100) NOT NULL, "
                            + "role VARCHAR(20) NOT NULL, "
                            + "created_at VARCHAR(30) NOT NULL"
                            + ");";
                }
                stmt.execute(createTableSql);
                System.out.println("✅ JDBC Relational Database 'users' table initialized.");

                String countSql = "SELECT COUNT(*) FROM users";
                ResultSet rs = stmt.executeQuery(countSql);
                if (rs.next() && rs.getInt(1) == 0) {
                    System.out.println("🌱 Seeding initial user credentials into JDBC database...");
                    String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                    addUser("admin", "Colon#2420", "admin", timestamp);
                    addUser("user", "user123", "user", timestamp);
                    System.out.println("✅ Default Admin ('admin') and User ('user') seeded.");
                }
                return;
            }
        } catch (Exception e) {
            System.out.println("⚠️ JDBC Driver not loaded in local runtime classpath: " + e.getMessage());
            System.out.println("📁 Switching automatically to persistent JSON File Database Engine ('users_db.json')...");
            useFileFallback = true;
            initFileDatabase();
        }
    }

    private static Connection getConnection() throws SQLException {
        String dbUrl = System.getenv("DB_URL");
        if (dbUrl != null && !dbUrl.isEmpty()) {
            String dbUser = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
            String dbPass = System.getenv("DB_PASS") != null ? System.getenv("DB_PASS") : "";
            return DriverManager.getConnection(dbUrl, dbUser, dbPass);
        }
        return DriverManager.getConnection(SQLITE_URL);
    }

    // --- Public API ---

    public static boolean addUser(String username, String password, String role) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return addUser(username, password, role, timestamp);
    }

    private static boolean addUser(String username, String password, String role, String createdAt) {
        if (useFileFallback) {
            return fileAddUser(username, password, role, createdAt);
        }
        String sql = "INSERT INTO users(username, password, role, created_at) VALUES(?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            pstmt.setString(2, password);
            pstmt.setString(3, role);
            pstmt.setString(4, createdAt);
            pstmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("JDBC Error adding user: " + e.getMessage());
            return false;
        }
    }

    public static Map<String, Object> authenticateUser(String username, String password) {
        if (useFileFallback) {
            return fileAuthenticateUser(username, password);
        }
        String sql = "SELECT id, username, role FROM users WHERE username = ? AND password = ?";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            pstmt.setString(2, password);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                Map<String, Object> user = new HashMap<>();
                user.put("id", rs.getInt("id"));
                user.put("username", rs.getString("username"));
                user.put("role", rs.getString("role"));
                return user;
            }
        } catch (SQLException e) {
            System.err.println("JDBC Error authenticating user: " + e.getMessage());
        }
        return null;
    }

    public static List<Map<String, Object>> getAllUsers() {
        if (useFileFallback) {
            return fileGetAllUsers();
        }
        List<Map<String, Object>> users = new ArrayList<>();
        String sql = "SELECT id, username, password, role, created_at FROM users ORDER BY id ASC";
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Map<String, Object> u = new HashMap<>();
                u.put("id", rs.getInt("id"));
                u.put("username", rs.getString("username"));
                u.put("password", rs.getString("password"));
                u.put("role", rs.getString("role"));
                u.put("created_at", rs.getString("created_at"));
                users.add(u);
            }
        } catch (SQLException e) {
            System.err.println("JDBC Error fetching users: " + e.getMessage());
        }
        return users;
    }

    public static boolean updateUserPassword(int userId, String newPassword) {
        if (useFileFallback) {
            return fileUpdateUserPassword(userId, newPassword);
        }
        String sql = "UPDATE users SET password = ? WHERE id = ?";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, newPassword);
            pstmt.setInt(2, userId);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("JDBC Error updating password: " + e.getMessage());
            return false;
        }
    }

    public static boolean deleteUser(int userId) {
        if (useFileFallback) {
            return fileDeleteUser(userId);
        }
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("JDBC Error deleting user: " + e.getMessage());
            return false;
        }
    }

    // --- File Database Fallback Engine ---

    private synchronized static void initFileDatabase() {
        List<Map<String, Object>> users = readUsersFromFile();
        if (users.isEmpty()) {
            System.out.println("🌱 Seeding initial user credentials into File Database ('users_db.json')...");
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            
            Map<String, Object> admin = new HashMap<>();
            admin.put("id", 1);
            admin.put("username", "admin");
            admin.put("password", "Colon#2420");
            admin.put("role", "admin");
            admin.put("created_at", timestamp);
            users.add(admin);

            Map<String, Object> standard = new HashMap<>();
            standard.put("id", 2);
            standard.put("username", "user");
            standard.put("password", "user123");
            standard.put("role", "user");
            standard.put("created_at", timestamp);
            users.add(standard);

            writeUsersToFile(users);
            System.out.println("✅ Default Admin ('admin') and User ('user') seeded into JSON storage.");
        }
    }

    private synchronized static boolean fileAddUser(String username, String password, String role, String createdAt) {
        List<Map<String, Object>> users = readUsersFromFile();
        for (Map<String, Object> u : users) {
            if (username.equalsIgnoreCase((String) u.get("username"))) {
                return false; // Already exists
            }
        }
        int maxId = 0;
        for (Map<String, Object> u : users) {
            int id = (int) u.get("id");
            if (id > maxId) maxId = id;
        }
        Map<String, Object> newUser = new HashMap<>();
        newUser.put("id", maxId + 1);
        newUser.put("username", username);
        newUser.put("password", password);
        newUser.put("role", role);
        newUser.put("created_at", createdAt);
        users.add(newUser);
        writeUsersToFile(users);
        return true;
    }

    private synchronized static Map<String, Object> fileAuthenticateUser(String username, String password) {
        List<Map<String, Object>> users = readUsersFromFile();
        for (Map<String, Object> u : users) {
            if (username.equals(u.get("username")) && password.equals(u.get("password"))) {
                Map<String, Object> result = new HashMap<>();
                result.put("id", u.get("id"));
                result.put("username", u.get("username"));
                result.put("role", u.get("role"));
                return result;
            }
        }
        return null;
    }

    private synchronized static List<Map<String, Object>> fileGetAllUsers() {
        return readUsersFromFile();
    }

    private synchronized static boolean fileUpdateUserPassword(int userId, String newPassword) {
        List<Map<String, Object>> users = readUsersFromFile();
        boolean found = false;
        for (Map<String, Object> u : users) {
            if ((int) u.get("id") == userId) {
                u.put("password", newPassword);
                found = true;
                break;
            }
        }
        if (found) writeUsersToFile(users);
        return found;
    }

    private synchronized static boolean fileDeleteUser(int userId) {
        List<Map<String, Object>> users = readUsersFromFile();
        boolean removed = users.removeIf(u -> (int) u.get("id") == userId);
        if (removed) writeUsersToFile(users);
        return removed;
    }

    private static List<Map<String, Object>> readUsersFromFile() {
        List<Map<String, Object>> list = new ArrayList<>();
        if (!JSON_DB_FILE.exists()) return list;
        try {
            String json = Files.readString(JSON_DB_FILE.toPath(), StandardCharsets.UTF_8).trim();
            if (json.startsWith("[") && json.endsWith("]")) {
                json = json.substring(1, json.length() - 1).trim();
                if (!json.isEmpty()) {
                    String[] objects = json.split("\\},\\s*\\{");
                    for (String objStr : objects) {
                        if (!objStr.startsWith("{")) objStr = "{" + objStr;
                        if (!objStr.endsWith("}")) objStr = objStr + "}";
                        Map<String, Object> u = parseUserJsonObject(objStr);
                        if (u != null) list.add(u);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading users JSON database file: " + e.getMessage());
        }
        return list;
    }

    private static Map<String, Object> parseUserJsonObject(String objStr) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("id", Integer.parseInt(extractValue(objStr, "id")));
            map.put("username", extractValue(objStr, "username"));
            map.put("password", extractValue(objStr, "password"));
            map.put("role", extractValue(objStr, "role"));
            map.put("created_at", extractValue(objStr, "created_at"));
            return map;
        } catch (Exception ex) {
            return null;
        }
    }

    private static String extractValue(String json, String key) {
        String patternQuoted = "\"" + key + "\":\"";
        int start = json.indexOf(patternQuoted);
        if (start != -1) {
            start += patternQuoted.length();
            int end = json.indexOf("\"", start);
            if (end != -1) return json.substring(start, end);
        }
        String patternRaw = "\"" + key + "\":";
        start = json.indexOf(patternRaw);
        if (start != -1) {
            start += patternRaw.length();
            while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '"')) start++;
            int end = start;
            while (end < json.length() && (Character.isLetterOrDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
            if (end > start) return json.substring(start, end);
        }
        return "";
    }

    private static void writeUsersToFile(List<Map<String, Object>> users) {
        StringBuilder sb = new StringBuilder("[\n");
        for (int i = 0; i < users.size(); i++) {
            Map<String, Object> u = users.get(i);
            sb.append(String.format(
                "  {\"id\": %d, \"username\": \"%s\", \"password\": \"%s\", \"role\": \"%s\", \"created_at\": \"%s\"}",
                u.get("id"),
                escapeJson((String) u.get("username")),
                escapeJson((String) u.get("password")),
                escapeJson((String) u.get("role")),
                escapeJson((String) u.get("created_at"))
            ));
            if (i < users.size() - 1) sb.append(",");
            sb.append("\n");
        }
        sb.append("]");
        try {
            Files.writeString(JSON_DB_FILE.toPath(), sb.toString(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing users JSON database file: " + e.getMessage());
        }
    }

    private static String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
