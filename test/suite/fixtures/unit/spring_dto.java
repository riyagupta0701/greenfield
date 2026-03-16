package com.example.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class UserDto {

    // Pattern A: regular DTO fields
    private String firstName;
    private String lastName;
    private String emailAddress;
    private int age;

    // Pattern A2: @JsonProperty overrides Java identifier
    @JsonProperty("phone_number")
    private String phoneNumber;

    @JsonProperty("date_of_birth")
    private String dateOfBirth;

    // ALL_CAPS constant — should be filtered
    public static final long serialVersionUID = 1L;
    private static final String DEFAULT_ROLE = "user";

    // Logger — should be filtered
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(UserDto.class);

    // Getters
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmailAddress() { return emailAddress; }
    public int getAge() { return age; }

    // Pattern B: Map.of response
    public Map<String, Object> toMap() {
        return Map.of("firstName", firstName, "lastName", lastName, "emailAddress", emailAddress);
    }

    // Pattern C: .put() style map building
    public void buildResponseMap(java.util.HashMap<String, Object> map) {
        map.put("userId", 42);
        map.put("displayName", firstName + " " + lastName);
    }
}
