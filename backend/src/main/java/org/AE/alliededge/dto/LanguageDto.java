package org.AE.alliededge.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LanguageDto(
        Long id,
        String language,
        String proficiency
) {
}

