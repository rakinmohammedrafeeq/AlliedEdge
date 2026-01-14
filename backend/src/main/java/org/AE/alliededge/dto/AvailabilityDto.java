package org.AE.alliededge.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AvailabilityDto(
        Boolean openToCollaboration,
        Boolean openToInternships,
        Boolean openToFreelance,
        Boolean justBuilding
) {
}

