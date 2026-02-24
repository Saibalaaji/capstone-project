package com.volunteer.dto;

import com.volunteer.model.AssistanceRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssistanceRequestResponse {
    private AssistanceRequest request;
    private List<VolunteerMatch> suggestedVolunteers;
}
