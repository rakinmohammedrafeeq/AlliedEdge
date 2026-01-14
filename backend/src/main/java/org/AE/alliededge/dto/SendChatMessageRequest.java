package org.AE.alliededge.dto;

public class SendChatMessageRequest {
    private String content;

    public SendChatMessageRequest() {
    }

    public SendChatMessageRequest(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}

