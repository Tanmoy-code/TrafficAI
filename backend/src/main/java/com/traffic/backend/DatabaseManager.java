package com.traffic.backend;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DatabaseManager {

    private static final String SQLITE_URL = "jdbc:sqlite:users.db";

    public static Connection getConnection() throws SQLException {
        String dbUrl = System.getenv("DB_URL");
        if (dbUrl != null && !dbUrl.isEmpty()) {
            String dbUser = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
            String dbPass = System.getenv("DB_PASS") != null ? System.getenv("DB_PASS") : "";
            return DriverManager.getConnection(dbUrl, dbUser, dbPass);
        }
        return DriverManager.getConnection(SQLITE_URL);
    }

    public static void initDatabase() {
        String createTableSql = "CREATE TABLE IF NOT EXISTS users ("
                + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "username VARCHAR(50) UNIQUE NOT NULL, "
                + "password VARCHAR(100) NOT NULL, "
                + "role VARCHAR(20) NOT NULL, "
                + "created_at VARCHAR(30) NOT NULL"
                + ");";

        // For MySQL compatibility if AUTOINCREMENT isn't recognized
        String dbUrl = System.getenv("DB_URL");
        if (dbUrl != null && dbUrl.contains("mysql")) {
            createTableSql = "CREATE TABLE IF NOT EXISTS users ("
                    + "id INT AUTO_INCREMENT PRIMARY KEY, "
                    + "username VARCHAR(50) UNIQUE NOT NULL, "
                    + "password VARCHAR(100) NOT NULL, "
                    + "role VARCHAR(20) NOT NULL, "
                    + "created_at VARCHAR(30) NOT NULL"
                    + ");";
        }

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(createTableSql);
            System.out.println("✅ Database table 'users' initialized successfully.");

            // Check if users exist, if not seed default admin and user
            String countSql = "SELECT COUNT(*) FROM users";
            ResultSet rs = stmt.executeQuery(countSql);
            if (rs.next() && rs.getInt(1) == 0) {
                System.out.println("🌱 Seeding initial user credentials...");
                String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                
                addUser("admin", "Colon#2420", "admin", timestamp);
                addUser("user", "user123", "user", timestamp);
                System.out.println("✅ Default Admin ('admin') and User ('user') seeded.");
            }
        } catch (SQLException e) {
            System.err.println("❌ Database initialization error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static boolean addUser(String username, String password, String role) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return addUser(username, password, role, timestamp);
    }

    private static boolean addUser(String username, String password, String role, String createdAt) {
        String sql = "INSERT INTO users(username, password, role, created_at) VALUES(?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            pstmt.setString(2, password);
            pstmt.setString(3, role);
            pstmt.setString(4, createdAt);
            pstmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("Error adding user: " + e.getMessage());
            return false;
        }
    }

    public static Map<String, Object> authenticateUser(String username, String password) {
        String sql = "SELECT id, username, role FROM users WHERE username = ? AND password = ?";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
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
            System.err.println("Error authenticating user: " + e.getMessage());
        }
        return null;
    }

    public static List<Map<String, Object>> getAllUsers() {
        List<Map<String, Object>> users = new ArrayList<>();
        String sql = "SELECT id, username, password, role, created_at FROM users ORDER BY id ASC";
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
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
            System.err.println("Error fetching users: " + e.getMessage());
        }
        return users;
    }

    public static boolean updateUserPassword(int userId, String newPassword) {
        String sql = "UPDATE users SET password = ? WHERE id = ?";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, newPassword);
            pstmt.setInt(2, userId);
            int updated = pstmt.executeUpdate();
            return updated > 0;
        } catch (SQLException e) {
            System.err.println("Error updating password: " + e.getMessage());
            return false;
        }
    }

    public static boolean deleteUser(int userId) {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            int deleted = pstmt.executeUpdate();
            return deleted > 0;
        } catch (SQLException e) {
            System.err.println("Error deleting user: " + e.getMessage());
            return false;
        }
    }
}
