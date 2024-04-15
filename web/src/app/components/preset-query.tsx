import { getSearchUrl } from "@/app/utils/get-search-url";
import Link from "next/link";
import React, { FC } from "react";

export const PresetQuery: FC<{ query: string }> = ({ query }) => {

  return (
    <Link
      prefetch={false}
      title={query}
      href={getSearchUrl(query)}
      className="border text-ellipsis overflow-hidden text-nowrap items-center rounded-lg bg-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-950 border-zinc-300/50 px-2 py-1 text-xs font-medium text-zinc-800"
    >
      {query}
    </Link>
  );
};
