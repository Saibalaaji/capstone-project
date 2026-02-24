package com.volunteer.dto;

import com.volunteer.model.Volunteer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerMatch {
    private Volunteer volunteer;
    private double matchScore;
}
