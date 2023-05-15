const express = require("express");

const formidable = require("formidable");

const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

const cors = require("cors");

const app = express();

const fs = require("fs");

app.use(
  cors({
    origin: ["http://localhost:3000", "https://notes-two-kohl.vercel.app/"],
  })
);

function toArrayBuffer(buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

app.post("/pdf", async (req, response) => {
  try {
    const form = formidable({ multiples: true });

    console.log(form);

    const result = await new Promise((res, rej) => {
      form.parse(req, async (err, fields, files) => {
        console.log(files.file.filepath);

        const file = fs.readFileSync(files.file.filepath);

        pdfjs.GlobalWorkerOptions.workerSrc =
          "pdfjs-dist/legacy/build/pdf.worker";

        const task = pdfjs.getDocument(toArrayBuffer(file));

        const pdf = await task.promise;

        const { numPages } = pdf;

        let textContent = "";

        await Promise.all(
          Array({ length: numPages }).map(async (el, ix) => {
            const page = await pdf.getPage(ix + 1);

            const text = await page.getTextContent();

            text.items.forEach((item) => (textContent += `${item.str} \n`));
          })
        );

        res(textContent);
      });
    });

    response.json({ text: result });
  } catch (error) {
    console.log(error);
    response.status(400).json("Error parsing pdf");
  }
});

app.get("/", (req, res) => {
  res.json("Hello world!");
});

app.listen(process.env.PORT || 4000, () => {
  console.log("working");
});
