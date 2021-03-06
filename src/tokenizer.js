var getTokens = (function() {

    var Punctuation,  // punctuation marks
        urlMode = false,
        blockMode = 0;

    Punctuation = {
        ' ': TokenType.Space,
        '\n': TokenType.Newline,
        '\r': TokenType.Newline,
        '\t': TokenType.Tab,
        '!': TokenType.ExclamationMark,
        '"': TokenType.QuotationMark,
        '#': TokenType.NumberSign,
        '$': TokenType.DollarSign,
        '%': TokenType.PercentSign,
        '&': TokenType.Ampersand,
        '\'': TokenType.Apostrophe,
        '(': TokenType.LeftParenthesis,
        ')': TokenType.RightParenthesis,
        '*': TokenType.Asterisk,
        '+': TokenType.PlusSign,
        ',': TokenType.Comma,
        '-': TokenType.HyphenMinus,
        '.': TokenType.FullStop,
        '/': TokenType.Solidus,
        ':': TokenType.Colon,
        ';': TokenType.Semicolon,
        '<': TokenType.LessThanSign,
        '=': TokenType.EqualsSign,
        '>': TokenType.GreaterThanSign,
        '?': TokenType.QuestionMark,
        '@': TokenType.CommercialAt,
        '[': TokenType.LeftSquareBracket,
        ']': TokenType.RightSquareBracket,
        '^': TokenType.CircumflexAccent,
        '_': TokenType.LowLine,
        '{': TokenType.LeftCurlyBracket,
        '|': TokenType.VerticalLine,
        '}': TokenType.RightCurlyBracket,
        '~': TokenType.Tilde
    };

    /**
     * Check if a character is a decimal digit
     * @param {string} c Character
     * @returns {boolean}
     */
    function isDecimalDigit(c) {
        return '0123456789'.indexOf(c) >= 0;
    }

    /**
     * Parse spaces
     * @param {string} css Unparsed part of CSS string
     */
    function parseSpaces(css) {
        var start = pos;

        // Read the string until we meet a non-space character:
        for (; pos < css.length; pos++) {
            if (css.charAt(pos) !== ' ') break;
        }

        // Add a substring containing only spaces to tokens:
        pushToken(TokenType.Space, css.substring(start, pos));
        pos--;
    }

    /**
     * Parse a string within quotes
     * @param {string} css Unparsed part of CSS string
     * @param {string} q Quote (either `'` or `"`)
     */
    function parseString(css, q) {
        var start = pos;

        // Read the string until we meet a matching quote:
        for (pos = pos + 1; pos < css.length; pos++) {
            // Skip escaped quotes:
            if (css.charAt(pos) === '\\') pos++;
            else if (css.charAt(pos) === q) break;
        }

        // Add the string (including quotes) to tokens:
        pushToken(q === '"' ? TokenType.StringDQ : TokenType.StringSQ, css.substring(start, pos + 1));
    }

    /**
     * Parse numbers
     * @param {string} css Unparsed part of CSS string
     */
    function parseDecimalNumber(css) {
        var start = pos;

        // Read the string until we meet a character that's not a digit:
        for (; pos < css.length; pos++) {
            if (!isDecimalDigit(css.charAt(pos))) break;
        }

        // Add the number to tokens:
        pushToken(TokenType.DecimalNumber, css.substring(start, pos));
        pos--;
    }

    /**
     * Parse identifier
     * @param {string} css Unparsed part of CSS string
     */
    function parseIdentifier(css) {
        var start = pos;

        // Skip all opening slashes:
        while (css.charAt(pos) === '/') pos++;

        // Read the string until we meet a punctuation mark:
        for (; pos < css.length; pos++) {
            // Skip all '\':
            if (css.charAt(pos) === '\\') pos++;
            else if (css.charAt(pos) in Punctuation) break;
        }

        var ident = css.substring(start, pos);

        // Enter url mode if parsed substring is `url`:
        urlMode = urlMode || ident === 'url';

        // Add identifier to tokens:
        pushToken(TokenType.Identifier, ident);
        pos--;
    }

    /**
     * Convert a CSS string to a list of tokens
     * @param {string} css CSS string
     * @returns {Array} List of tokens
     * @private
     */
    function _getTokens(css, syntax) {
        var c, // current character
            cn; // next character

        // Reset counters:
        tokens = [];
        pos = 0;
        tn = 0;
        ln = 1;

        // Parse string, character by character:
        for (pos = 0; pos < css.length; pos++) {
            c = css.charAt(pos);
            cn = css.charAt(pos + 1);

            // If we meet `/*`, it's a start of a multiline comment.
            // Parse following characters as a multiline comment:
            if (c === '/' && cn === '*') {
                s.parseMLComment(css);
            }
            // If we meet `//` and it is not a part of url:
            else if (!urlMode && c === '/' && cn === '/') {
                // If we're currently inside a block, treat `//` as a start
                // of identifier. Else treat `//` as a start of a single-line
                // comment:
                if (syntax === 'css' && blockMode > 0) parseIdentifier(css);
                else s.parseSLComment && s.parseSLComment(css);
            }
            // If current character is a double or single quote, it's a start
            // of a string:
            else if (c === '"' || c === "'") {
                parseString(css, c);
            }
            // If current character is a space:
            else if (c === ' ') {
                parseSpaces(css)
            }
            // If current character is a punctuation mark:
            else if (c in Punctuation) {
                // Add it to the list of tokens:
                pushToken(Punctuation[c], c);
                if (c === '\n' || c === '\r') ln++; // Go to next line
                if (c === ')') urlMode = false; // exit url mode
                if (c === '{') blockMode++; // enter a block
                if (c === '}') blockMode--; // exit a block
            }
            // If current character is a decimal digit:
            else if (isDecimalDigit(c)) {
                parseDecimalNumber(css);
            }
            // If current character is anything else:
            else {
                parseIdentifier(css);
            }
        }
    }

    return function(s, syntax) {
        return _getTokens(s, syntax);
    };

}());
