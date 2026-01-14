package org.AE.alliededge.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ExperienceDto(
        Long id,
        String company,
        String position,
        String startDate,
        String endDate,
        String description
) {
}

