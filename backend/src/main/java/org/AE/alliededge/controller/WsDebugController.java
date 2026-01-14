package org.AE.alliededge.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Temporary diagnostics endpoint to verify if /ws/** isn't being accidentally blocked.
 */
@RestController
@RequestMapping("/ws")
public class WsDebugController {

    @GetMapping("/debug")
    public ResponseEntity<?> debug() {
        return ResponseEntity.ok(Map.of("ok", true));
    }
}

