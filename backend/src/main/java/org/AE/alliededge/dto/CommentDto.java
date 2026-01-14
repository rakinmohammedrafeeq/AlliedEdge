package org.AE.alliededge.dto;

import jakarta.validation.constraints.NotEmpty;

public class CommentDto {
    @NotEmpty(message = "Content must not be empty")
    public String content;


    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

}
