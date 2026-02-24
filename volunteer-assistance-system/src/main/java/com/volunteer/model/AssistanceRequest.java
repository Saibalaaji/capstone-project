package com.volunteer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "assistance_requests")
public class AssistanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Requester name is required")
    private String requesterName;

    @NotBlank(message = "Requester contact is required")
    private String requesterContact;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Service type is required")
    private String serviceType;

    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Urgency level is required")
    private UrgencyLevel urgencyLevel;

    @Enumerated(EnumType.STRING)
    private RequestStatus status = RequestStatus.PENDING;

    private Long assignedVolunteerId;
}
