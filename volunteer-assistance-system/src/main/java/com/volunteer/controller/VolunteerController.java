package com.volunteer.controller;

import com.volunteer.model.Volunteer;
import com.volunteer.service.VolunteerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/volunteers")
@RequiredArgsConstructor
@Tag(name = "Volunteer Management", description = "APIs for managing volunteers")
public class VolunteerController {

    private final VolunteerService volunteerService;

    @Operation(summary = "Create a new volunteer", description = "Register a new volunteer in the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Volunteer created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PostMapping
    public ResponseEntity<Volunteer> createVolunteer(@Valid @RequestBody Volunteer volunteer) {
        Volunteer createdVolunteer = volunteerService.createVolunteer(volunteer);
        return new ResponseEntity<>(createdVolunteer, HttpStatus.CREATED);
    }

    @Operation(summary = "Get all volunteers", description = "Retrieve a list of all registered volunteers")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved list")
    @GetMapping
    public ResponseEntity<List<Volunteer>> getAllVolunteers() {
        List<Volunteer> volunteers = volunteerService.getAllVolunteers();
        return ResponseEntity.ok(volunteers);
    }

    @Operation(summary = "Get volunteer by ID", description = "Retrieve a specific volunteer by their ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Volunteer found"),
            @ApiResponse(responseCode = "404", description = "Volunteer not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Volunteer> getVolunteerById(@PathVariable Long id) {
        Volunteer volunteer = volunteerService.getVolunteerById(id);
        return ResponseEntity.ok(volunteer);
    }

    @Operation(summary = "Update volunteer", description = "Update an existing volunteer's information")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Volunteer updated successfully"),
            @ApiResponse(responseCode = "404", description = "Volunteer not found"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Volunteer> updateVolunteer(
            @PathVariable Long id,
            @Valid @RequestBody Volunteer volunteer) {
        Volunteer updatedVolunteer = volunteerService.updateVolunteer(id, volunteer);
        return ResponseEntity.ok(updatedVolunteer);
    }

    @Operation(summary = "Delete volunteer", description = "Remove a volunteer from the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Volunteer deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Volunteer not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVolunteer(@PathVariable Long id) {
        volunteerService.deleteVolunteer(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get active volunteers", description = "Retrieve all volunteers with active status")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved active volunteers")
    @GetMapping("/active")
    public ResponseEntity<List<Volunteer>> getActiveVolunteers() {
        List<Volunteer> activeVolunteers = volunteerService.getActiveVolunteers();
        return ResponseEntity.ok(activeVolunteers);
    }
}
