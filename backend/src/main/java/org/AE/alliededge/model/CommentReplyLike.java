package org.AE.alliededge.model;

import jakarta.persistence.*;

@Entity
@Table(name = "comment_reply_likes", uniqueConstraints = @UniqueConstraint(columnNames = {"reply_id", "user_id"}))
public class CommentReplyLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reply_id", nullable = false)
    private CommentReply reply;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CommentReply getReply() { return reply; }
    public void setReply(CommentReply reply) { this.reply = reply; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}

