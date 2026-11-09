"use strict";

var { once } = require("node:events");
var assert = require("node:assert");
var { describe, it } = require("node:test");
var Stream = require("node:stream");

var Readable = Stream.Readable;
var Writable = Stream.Writable;
var Transform = Stream.Transform;
var Duplex = Stream.Duplex;

var exhaust = require("../index.js");

describe("exhaust", function () {
  it("should cause a Readable stream to complete if it's not piped anywhere", async () => {
    var reads = 0;
    var rs = Readable.from(
      chunks(100, () => {
        reads++;
      }),
      {
        highWaterMark: 2,
      },
    );

    var ended = once(rs, "end");

    assert.strictEqual(exhaust(rs), rs);

    await ended;

    assert.strictEqual(reads, 100);
  });

  it("should work with Readable streams in objectMode", async () => {
    var reads = 0;
    var rs = Readable.from(
      chunks(100, () => {
        reads++;
      }),
      {
        highWaterMark: 2,
        objectMode: true,
      },
    );

    var ended = once(rs, "end");

    assert.strictEqual(exhaust(rs), rs);

    await ended;

    assert.strictEqual(reads, 100);
  });

  it("should not interfere with a Readable stream that is piped somewhere", async () => {
    var rs = Readable.from(chunks(), {
      highWaterMark: 2,
    });

    var writeReads = 0;
    var ws = new Writable({
      highWaterMark: 2,
      write(chunk, enc, next) {
        writeReads += chunk.length;
        next();
      },
    });

    var finished = once(ws, "finish");

    rs.pipe(ws);
    exhaust(rs);

    await finished;

    assert.strictEqual(writeReads, 100);
  });

  it("should not interfere with a Writable stream that is piped", async () => {
    var rs = Readable.from(chunks(), {
      highWaterMark: 2,
    });

    var writeReads = 0;
    var ws = new Writable({
      highWaterMark: 2,
      write(chunk, enc, cb) {
        writeReads += chunk.length;
        cb();
      },
    });

    var finished = once(ws, "finish");

    rs.pipe(ws);
    assert.strictEqual(ws, exhaust(ws));

    await finished;

    assert.strictEqual(writeReads, 100);
  });

  it("should handle a Transform stream", async () => {
    var rs = Readable.from(chunks(), {
      highWaterMark: 2,
    });

    var tsReads = 0;

    var ts = new Transform({
      highWaterMark: 2,
      transform(chunk, encoding, cb) {
        tsReads += chunk.length;
        cb(null, chunk);
      },
      flush(cb) {
        cb();
      },
    });

    rs.pipe(ts);

    var finished = once(ts, "finish");

    assert.strictEqual(ts, exhaust(ts));

    await finished;
    assert.strictEqual(tsReads, 100);
  });

  it("handles Duplex streams", async () => {
    var remaining = [...chunks()];
    var bytesRead = 0;
    var writeReads = 0;

    var ds = new Duplex({
      highWaterMark: 2,
      read() {
        if (remaining.length === 0) {
          this.push(null);
          return;
        }

        var chunk = remaining.shift();
        bytesRead += chunk.length;
        this.push(chunk);
      },
      write(chunk, enc, cb) {
        writeReads += chunk.length;

        cb();
      },
    });

    var ended = once(ds, "end");
    ds.pipe(ds);
    assert.strictEqual(exhaust(ds), ds);

    await ended;
    assert.strictEqual(bytesRead, 100);
    assert.strictEqual(writeReads, 100);
  });

  it("handles classic streams", () => {
    var rs = new Stream();
    var ended = false;

    rs.on("end", function () {
      ended = true;
    });

    exhaust(rs);

    for (var i = 0; i < 100; i++) {
      rs.emit("data", i);
    }

    rs.emit("end");

    assert.strictEqual(ended, true);
  });

  it("does not modify .pipe", () => {
    var stream = new Readable();
    var pipe = stream.pipe;

    stream._read = function () {
      stream.push("ending");
      stream.push(null);
    };

    exhaust(stream);

    assert.strictEqual(stream.pipe, pipe);
  });

  it("handles readable classic streams without resume", () => {
    var rs = new Stream();
    rs.readable = true;

    var ended = false;

    rs.on("end", function () {
      ended = true;
    });

    exhaust(rs);

    for (var i = 0; i < 100; i++) {
      rs.emit("data", i);
    }

    rs.emit("end");

    assert.strictEqual(ended, true);
  });
});

function* chunks(count = 100, onRead) {
  for (var i = 0; i < count; i++) {
    if (onRead) {
      onRead();
    }
    yield ".";
  }
}
