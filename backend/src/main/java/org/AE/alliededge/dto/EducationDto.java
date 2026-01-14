package org.AE.alliededge.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EducationDto(
        Long id,
        String school,
        String degree,
        String field,
        String startYear,
        String endYear,
        String cgpa
) {
}

