import { Answer } from "@/app/components/answer";
import { Sources } from "@/app/components/sources";
import { FC, useEffect, useState } from "react";
import {
  LLM_START_TOKEN,
  LLM_END_TOKEN,
  SEARCH_START_TOKEN,
  SEARCH_END_TOKEN,
} from "../../r2r-js-client";
import { UploadButton } from "./upload"; // Import the new component
import { R2RClient } from "../../r2r-js-client";
const markdownParse = (text: string) => {
  return text
    .replace(/\[\[([cC])itation/g, "[citation")
    .replace(/[cC]itation:(\d+)]]/g, "citation:$1]")
    .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
    .replace(/\[[cC]itation:(\d+)]/g, "[citation]($1)")
    .replace("\n", "\\n");
};

export const Result: FC<{
  query: string;
  userId: string;
  apiUrl: string | undefined;
  model: string;
  uploadedDocuments: string[];
  setUploadedDocuments: any;
  setLogFetchID: any;
}> = ({
  query,
  userId,
  apiUrl,
  model,
  uploadedDocuments,
  setUploadedDocuments,
  setLogFetchID,
}) => {
  const [sources, setSources] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [error, setError] = useState<number | null>(null);

  let timeout: NodeJS.Timeout;

  const parseStreaming = async (query, userId, apiUrl) => {
    setSources(null);
    setMarkdown("");
    const response = await fetch(
      `/api/rag-completion?query=${query}&userId=${userId}&apiUrl=${apiUrl}&model=${model}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
      },
    );

    if (response.status !== 200) {
      setError(response.status);
      return;
    }
    if (!response.body) {
      return;
    }

    const reader = response.body.getReader();
    let decoder = new TextDecoder();
    let sink = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      sink += chunk;
      console.log("sink = ", sink);

      if (sink.includes(SEARCH_END_TOKEN)) {
        let results = sink.split(SEARCH_END_TOKEN)[0];
        results = results.replace(SEARCH_START_TOKEN, "");
        setSources(results);
      }

      if (sink.includes(LLM_START_TOKEN)) {
        let md = sink.split(LLM_START_TOKEN)[1];
        setMarkdown(markdownParse(md));
      }
    }
    let md = sink.split(LLM_START_TOKEN)[1];
    if (md !== undefined) {
      md = md.replace(LLM_END_TOKEN, "");
      setMarkdown(markdownParse(md));
    }
    const client = new R2RClient(apiUrl);
    setLogFetchID(client.generateRunId());
  };
  useEffect(() => {
    const controller = new AbortController();

    if (query === "") {
      return;
    }

    const debouncedParseStreaming = () => {
      clearTimeout(timeout); // Clear any existing timeout
      timeout = setTimeout(() => {
        parseStreaming(query, userId, apiUrl);
      }, 500);
    };

    debouncedParseStreaming();

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, userId]);

  // TOOD - Include the error component
  return (
    <div className="flex flex-col gap-8">
      <Answer markdown={markdown} sources={sources}></Answer>
      <Sources sources={sources}></Sources>

      {uploadedDocuments?.length === 0 && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="flex items-center p-4 bg-white shadow-2xl rounded text-blue-500 font-medium gap-4">
            Please upload atleast one document to submit queries.{" "}
            <UploadButton
              userId={userId}
              apiUrl={apiUrl}
              uploadedDocuments={uploadedDocuments}
              setUploadedDocuments={setUploadedDocuments}
              setLogFetchID={setLogFetchID}
            />
          </div>
        </div>
      )}

      {uploadedDocuments?.length !== 0 && query === "" && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="p-4 bg-white shadow-2xl rounded text-blue-500 font-medium flex gap-4">
            Please submit a query.
          </div>
        </div>
      )}
    </div>
  );
};
