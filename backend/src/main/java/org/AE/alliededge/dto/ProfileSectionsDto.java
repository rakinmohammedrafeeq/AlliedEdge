package org.AE.alliededge.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * JSON sections edited on the profile page.
 * Stored in User as JSON strings.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProfileSectionsDto(
        List<ExperienceDto> experience,
        List<LanguageDto> languages,
        List<EducationDto> education,
        AvailabilityDto availability
) {
}


