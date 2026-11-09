<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# stream-exhaust

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Ensure that the provided stream is flowing data, even if the stream hasn't been
piped to another stream.

## Usage

```javascript
var exhaustively = require("stream-exhaust");

exhaustively(fs.createReadStream(__filename)).on("close", () => {
  console.log("all done, despite being streams{1+N}!");
});
```

## Prior Art

This is based on [stream-consume][stream-consume] by [aroneous][aroneous]. It is a separate package because it has
different semantics:

1. It does not call `.resume()` on streams2+ streams. streams2 streams monkeypatch `.pipe` when entering flowing mode; avoiding `resume()` avoids that fate.
2. It does not examine `._readableState`; instead it checks for the presence of `._read`.

## API

### exhaust(Stream s) -> Stream s

Takes a stream, `s`, and returns it. Ensures that the stream is flowing, either by calling
`.resume()` if the stream is a streams1 stream, or by piping it to a "black hole" stream that
continually asks for more data.

## Strict No LLM / No AI Policy

No LLMs for issues.

No LLMs for patches / pull requests.

No LLMs for comments on the bug tracker, including translation.

English is encouraged, but not required. You are welcome to post in your native language and rely on others to have their own translation tools of choice to interpret your words.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/stream-exhaust.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/stream-exhaust
[npm-image]: https://img.shields.io/npm/v/stream-exhaust.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/stream-exhaust/actions/workflows/dev.yml
[ci-image]: https://img.shields.io/github/actions/workflow/status/gulpjs/stream-exhaust/dev.yml?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/stream-exhaust
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/stream-exhaust/main.svg?style=flat-square
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
[stream-consume]: https://github.com/aroneous/stream-consume
[aroneous]: https://github.com/aroneous
<!-- prettier-ignore-end -->
