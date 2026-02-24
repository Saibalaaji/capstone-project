package com.volunteer.controller;

import com.volunteer.dto.AssistanceRequestResponse;
import com.volunteer.model.AssistanceRequest;
import com.volunteer.model.RequestStatus;
import com.volunteer.service.AssistanceRequestService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@Tag(name = "Assistance Request Management", description = "APIs for managing assistance requests with AI-based volunteer matching")
public class AssistanceRequestController {

    private final AssistanceRequestService requestService;

    @Operation(summary = "Create assistance request", description = "Create a new assistance request and get top 3 AI-matched volunteers based on availability, service type, location, and rating")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Request created with suggested volunteers"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PostMapping
    public ResponseEntity<AssistanceRequestResponse> createRequest(
            @Valid @RequestBody AssistanceRequest request) {
        AssistanceRequestResponse response = requestService.createRequest(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @Operation(summary = "Get all requests", description = "Retrieve all assistance requests")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved list")
    @GetMapping
    public ResponseEntity<List<AssistanceRequest>> getAllRequests() {
        List<AssistanceRequest> requests = requestService.getAllRequests();
        return ResponseEntity.ok(requests);
    }

    @Operation(summary = "Get request by ID", description = "Retrieve a specific assistance request")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Request found"),
            @ApiResponse(responseCode = "404", description = "Request not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<AssistanceRequest> getRequestById(@PathVariable Long id) {
        AssistanceRequest request = requestService.getRequestById(id);
        return ResponseEntity.ok(request);
    }

    @Operation(summary = "Update request status", description = "Change the status of an assistance request (PENDING, ASSIGNED, COMPLETED)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status updated successfully"),
            @ApiResponse(responseCode = "404", description = "Request not found"),
            @ApiResponse(responseCode = "400", description = "Invalid status value")
    })
    @PatchMapping("/{id}/status")
    public ResponseEntity<AssistanceRequest> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {

        RequestStatus status = RequestStatus.valueOf(statusUpdate.get("status"));
        AssistanceRequest updatedRequest = requestService.updateRequestStatus(id, status);
        return ResponseEntity.ok(updatedRequest);
    }

    @Operation(summary = "Assign volunteer", description = "Assign a volunteer to an assistance request and update status to ASSIGNED")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Volunteer assigned successfully"),
            @ApiResponse(responseCode = "404", description = "Request or volunteer not found"),
            @ApiResponse(responseCode = "400", description = "Volunteer is inactive")
    })
    @PostMapping("/{requestId}/assign/{volunteerId}")
    public ResponseEntity<AssistanceRequest> assignVolunteer(
            @PathVariable Long requestId,
            @PathVariable Long volunteerId) {

        AssistanceRequest updatedRequest = requestService.assignVolunteer(requestId, volunteerId);
        return ResponseEntity.ok(updatedRequest);
    }

    @Operation(summary = "Delete request", description = "Remove an assistance request from the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Request deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Request not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        requestService.deleteRequest(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get requests by status", description = "Filter assistance requests by their status")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved filtered requests")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AssistanceRequest>> getRequestsByStatus(@PathVariable RequestStatus status) {
        List<AssistanceRequest> requests = requestService.getRequestsByStatus(status);
        return ResponseEntity.ok(requests);
    }
}
