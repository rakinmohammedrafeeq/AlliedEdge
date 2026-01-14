package org.AE.alliededge.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ContentLinkifier {
    // Detect full anchor tags so we don't modify their contents
    private static final Pattern ANCHOR_PATTERN = Pattern.compile("<a\\b[^>]*>.*?</a>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    // URL pattern (basic) not preceded by quote or equals (to avoid matching inside attributes)
    private static final Pattern URL_PATTERN = Pattern.compile("(?<![\"'=])(https?://[\\w./?%&=+#-]+)");

    public static String linkify(String original) {
        if (original == null || original.isBlank()) return original;

        // Find existing anchor tag ranges to skip
        List<int[]> anchorRanges = new ArrayList<>();
        Matcher anchorMatcher = ANCHOR_PATTERN.matcher(original);
        while (anchorMatcher.find()) {
            anchorRanges.add(new int[]{anchorMatcher.start(), anchorMatcher.end()});
        }

        StringBuilder sb = new StringBuilder();
        Matcher urlMatcher = URL_PATTERN.matcher(original);
        int lastIndex = 0;

        while (urlMatcher.find()) {
            int start = urlMatcher.start();
            int end = urlMatcher.end();
            if (isInsideRanges(start, anchorRanges)) {
                // leave unchanged
                continue;
            }
            String url = urlMatcher.group(1);
            // Append text before URL (from lastIndex up to start) but only up to current match start if not already appended
            if (start >= lastIndex) {
                sb.append(original, lastIndex, start);
                // Append anchor
                sb.append("<a href=\"").append(url).append("\" target=\"_blank\" rel=\"noopener noreferrer\">").append(url).append("</a>");
                lastIndex = end;
            }
        }
        // Append remaining tail
        if (lastIndex < original.length()) {
            sb.append(original.substring(lastIndex));
        }

        // If we never appended anything (no changes), return original
        return sb.isEmpty() ? original : sb.toString();
    }

    private static boolean isInsideRanges(int pos, List<int[]> ranges) {
        for (int[] r : ranges) {
            if (pos >= r[0] && pos < r[1]) return true;
        }
        return false;
    }
}
