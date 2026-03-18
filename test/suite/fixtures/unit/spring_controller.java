package com.example.api;

import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class UserController {

    // Pattern A1+A2: @RequestBody with getter calls
    @PostMapping("/users")
    public UserResponse createUser(@RequestBody UserDto req) {
        String firstName = req.getFirstName();
        String lastName = req.getLastName();
        String emailAddr = req.getEmailAddress();
        return new UserResponse(firstName, lastName);
    }

    // Pattern A3: direct field access on @RequestBody
    @PutMapping("/users/{id}")
    public UserResponse updateUser(@RequestBody UserDto req) {
        String fn = req.firstName;
        String ln = req.lastName;
        return new UserResponse(fn, ln);
    }

    // Pattern B1: @RequestParam with explicit name
    @GetMapping("/search")
    public SearchResult search(@RequestParam("query") String q,
                               @RequestParam("pageSize") int size) {
        return new SearchResult();
    }

    // Pattern B2: @RequestParam without explicit name
    @GetMapping("/filter")
    public FilterResult filter(@RequestParam String category,
                               @RequestParam int limit) {
        return new FilterResult();
    }

    // Pattern C: HttpServletRequest.getParameter
    @PostMapping("/legacy")
    public LegacyResponse legacy(HttpServletRequest request) {
        String token = request.getParameter("authToken");
        String clientId = request.getParameter("clientId");
        return new LegacyResponse();
    }
}
