package org.AE.alliededge.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AppErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<Map<String, Object>> handleError(HttpServletRequest request) {
        Object statusObj = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object messageObj = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        int statusCode = 500;
        if (statusObj instanceof Integer) {
            statusCode = (Integer) statusObj;
        } else if (statusObj != null) {
            try {
                statusCode = Integer.parseInt(statusObj.toString());
            } catch (NumberFormatException ignored) {
            }
        }
        String path = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", statusCode);
        body.put("path", path);
        body.put("errorMessage", messageObj != null ? messageObj.toString() : "Unexpected error");

        HttpStatus status;
        try {
            status = HttpStatus.valueOf(statusCode);
        } catch (Exception ex) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(status).body(body);
    }
}
