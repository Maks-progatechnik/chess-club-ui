import { Show, useAuth } from "@clerk/react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { clubGet, clubPost } from "@/lib/club-api";
import { playerPath } from "@/lib/players";
import type { DrawGroup, IPairing } from "@/lib/draw";
import { cn } from "@/lib/utils";

export interface IDrawnPairs {
  advanced: IPairing[];
  beginner: IPairing[];
}

interface ISavedDraw {
  id: number;
  createdAt: string;
  result: IDrawnPairs;
}

interface IDrawsResponse {
  draws: ISavedDraw[];
}

type HistoryState =
  | { status: "loading" }
  | { status: "ready"; draws: ISavedDraw[] }
  | { status: "error"; message: string };

export interface ISignupPlayer {
  name: string;
  chessCom: string | null;
  claimed: boolean;
  mine: boolean;
}

interface IDummiesResponse {
  dummies: ISignupPlayer[];
}

interface IAddGame {
  drawId: number;
  group: DrawGroup;
  pairing: IPairing;
  url: string;
}

interface IDrawHistoryProps {
  history: HistoryState;
  roster: ISignupPlayer[];
  onAddGame: (game: IAddGame) => Promise<string | null>;
}

interface IDrawPair {
  group: DrawGroup;
  pairing: IPairing;
}

export interface IPairGame {
  group: DrawGroup;
  pairing: IPairing;
  url: string;
}

interface IPairSectionProps {
  result: IDrawnPairs;
  roster: ISignupPlayer[];
  pending?: boolean;
  onAddGame: (game: IPairGame) => Promise<string | null>;
}

interface IPairRowProps {
  pairing: IPairing;
  roster: ISignupPlayer[];
  pending: boolean;
  onAddGame: (url: string) => Promise<string | null>;
}

interface IGameModalProps {
  pairing: IPairing;
  roster: ISignupPlayer[];
  games: string[];
  onAdd: (url: string) => Promise<string | null>;
  onClose: () => void;
}

interface IPlayerLabelProps {
  name: string;
  roster: ISignupPlayer[];
}

interface IGameLinkProps {
  href: string;
}

export function DrawPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <DrawBoard />
      </Show>
    </main>
  );
}

function SignedOutNotice() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
        Draw
      </p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">
        Sign in to see past draws.
      </h1>
      <Link
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-7 hover:bg-secondary",
        )}
        to="/sign-in"
      >
        Sign in
      </Link>
    </section>
  );
}

function DrawBoard() {
  const { getToken } = useAuth();
  const [roster, setRoster] = useState<ISignupPlayer[]>([]);
  const [history, setHistory] = useState<HistoryState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadRoster() {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }
        const sheet = await clubGet<IDummiesResponse>("/dummies", token);
        if (!cancelled) {
          setRoster(Array.isArray(sheet.dummies) ? sheet.dummies : []);
        }
      } catch {
        if (!cancelled) {
          setRoster([]);
        }
      }
    }

    async function loadHistory() {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Clerk has not issued a session token yet.");
        }

        const body = await clubGet<IDrawsResponse>("/draws", token);
        if (!Array.isArray(body.draws)) {
          throw new Error("The club API returned an unexpected draw history.");
        }

        if (!cancelled) {
          setHistory({
            status: "ready",
            draws: body.draws.map((draw) => ({
              ...draw,
              result: withGames(draw.result),
            })),
          });
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not reach the club API.";
          setHistory({ status: "error", message });
        }
      }
    }

    void loadRoster();
    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  async function postGame(game: IAddGame): Promise<string | null> {
    const { drawId, group, pairing, url } = game;
    try {
      const token = await getToken();
      if (!token) {
        return "Clerk has not issued a session token yet.";
      }

      const saved = await clubPost<ISavedDraw>(
        `/draws/${drawId}/games`,
        token,
        {
          group,
          white: pairing.white,
          black: pairing.black,
          url,
        },
      );
      setHistory((current) => {
        const previous = current.status === "ready" ? current.draws : [];
        const rest = previous.filter((draw) => draw.id !== saved.id);
        return {
          status: "ready",
          draws: [
            { ...saved, result: withGames(saved.result) },
            ...rest,
          ],
        };
      });
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Could not save this game.";
    }
  }

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
        Past draws
      </p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">
        Draw
      </h1>
      <DrawHistory history={history} onAddGame={postGame} roster={roster} />
    </section>
  );
}

function DrawHistory(props: IDrawHistoryProps) {
  const { history, roster, onAddGame } = props;

  return (
    <section className="mt-10">
      {history.status === "loading" ? (
        <p className="mt-4 text-muted-foreground">Loading saved draws…</p>
      ) : null}
      {history.status === "error" ? (
        <p className="mt-4 text-muted-foreground">{history.message}</p>
      ) : null}
      {history.status === "ready" && history.draws.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No saved draws.</p>
      ) : null}
      {history.status === "ready"
        ? history.draws.map((saved) => (
            <article className="mt-8" key={saved.id}>
              <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
                {formatSavedAt(saved.createdAt)}
              </p>
              <PairSection
                onAddGame={(game) =>
                  onAddGame({
                    drawId: saved.id,
                    group: game.group,
                    pairing: game.pairing,
                    url: game.url,
                  })
                }
                result={saved.result}
                roster={roster}
              />
            </article>
          ))
        : null}
    </section>
  );
}

function formatSavedAt(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function listedPairs(result: IDrawnPairs): IDrawPair[] {
  return [
    ...result.beginner.map((pairing) => ({ group: "beginner" as DrawGroup, pairing })),
    ...result.advanced.map((pairing) => ({ group: "advanced" as DrawGroup, pairing })),
  ];
}

export function PairSection(props: IPairSectionProps) {
  const { result, roster, pending = false, onAddGame } = props;
  const pairs = listedPairs(result);

  if (pairs.length === 0) {
    return <p className="mt-4 text-muted-foreground">No pairs in this draw.</p>;
  }

  return (
    <div className="mt-4">
      {pairs.map((pair) => (
        <PairRow
          key={`${pair.group}-${pair.pairing.white}-${pair.pairing.black ?? "bye"}`}
          onAddGame={(url) =>
            onAddGame({
              group: pair.group,
              pairing: pair.pairing,
              url,
            })
          }
          pairing={pair.pairing}
          pending={pending}
          roster={roster}
        />
      ))}
    </div>
  );
}

function PairRow(props: IPairRowProps) {
  const { pairing, roster, pending, onAddGame } = props;
  const [open, setOpen] = useState(false);
  const games = pairing.games ?? [];

  if (!pairing.black) {
    return (
      <p className="border-b py-3">
        <PlayerLabel name={pairing.white} roster={roster} />
        <span className="text-muted-foreground"> has a bye.</span>
      </p>
    );
  }

  return (
    <div className="border-b py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p>
            <PlayerLabel name={pairing.white} roster={roster} />
            <span className="mx-3 text-xs font-bold tracking-[0.14em] text-secondary uppercase">
              vs
            </span>
            <PlayerLabel name={pairing.black} roster={roster} />
          </p>
          {pairing.across ? (
            <p className="mt-1 text-sm text-muted-foreground">Across groups</p>
          ) : null}
        </div>
        <button
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            "shrink-0",
          )}
          disabled={pending}
          onClick={() => setOpen(true)}
          type="button"
        >
          {games.length === 0 ? "Add game" : "Add another"}
        </button>
      </div>
      {games.length > 0 ? (
        <ul className="mt-2">
          {games.map((game) => (
            <li key={game}>
              <GameLink href={game} />
            </li>
          ))}
        </ul>
      ) : null}
      {open ? (
        <GameModal
          games={games}
          onAdd={onAddGame}
          onClose={() => setOpen(false)}
          pairing={pairing}
          roster={roster}
        />
      ) : null}
    </div>
  );
}

function GameModal(props: IGameModalProps) {
  const { pairing, roster, games, onAdd, onClose } = props;
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const nextMessage = await onAdd(url);
      setMessage(nextMessage);
      if (!nextMessage) {
        setUrl("");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="game-link-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-lg border border-border bg-background p-6 text-foreground"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
          Chess.com
        </p>
        <h2
          className="mt-3 text-3xl font-bold tracking-normal"
          id="game-link-title"
        >
          Add a game
        </h2>
        <p className="mt-4">
          <PlayerLabel name={pairing.white} roster={roster} />
          <span className="mx-3 text-xs font-bold tracking-[0.14em] text-secondary uppercase">
            vs
          </span>
          <PlayerLabel name={pairing.black ?? ""} roster={roster} />
        </p>
        {games.length > 0 ? (
          <ul className="mt-4">
            {games.map((game) => (
              <li className="border-b py-2" key={game}>
                <GameLink href={game} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-muted-foreground">
            No games for this match yet.
          </p>
        )}
        <form
          className="mt-5 grid gap-3"
          onSubmit={(event) => void submit(event)}
        >
          <input
            aria-label="Chess.com game link"
            autoFocus
            className="h-9 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.chess.com/game/live/…"
            value={url}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={cn(
                buttonVariants({ size: "lg" }),
                "hover:bg-secondary",
              )}
              disabled={pending}
              type="submit"
            >
              {pending ? "Adding…" : "Add game"}
            </button>
            <button
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              onClick={onClose}
              type="button"
            >
              Done
            </button>
          </div>
          {message ? <p className="text-secondary">{message}</p> : null}
        </form>
      </div>
    </div>
  );
}

function GameLink(props: IGameLinkProps) {
  const { href } = props;

  return (
    <a
      className="text-sm text-secondary underline underline-offset-4"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {href.replace("https://www.chess.com", "chess.com")}
    </a>
  );
}

function PlayerLabel(props: IPlayerLabelProps) {
  const { name, roster } = props;
  const player = roster.find(
    (row) => row.name.toLowerCase() === name.toLowerCase(),
  );
  const note = playerNote(player);

  return (
    <span className="font-bold">
      <Link
        className="underline-offset-4 hover:text-secondary hover:underline"
        to={playerPath(name)}
      >
        {name}
      </Link>
      {note ? (
        <span className="mt-1 block text-sm font-normal text-muted-foreground">
          {note}
        </span>
      ) : null}
    </span>
  );
}

function playerNote(player: ISignupPlayer | undefined): string | null {
  if (!player || (!player.claimed && !player.mine)) {
    return null;
  }
  if (player.mine) {
    return player.chessCom ? `You · ${player.chessCom}` : "You";
  }
  return player.chessCom;
}

function withGames(result: IDrawnPairs): IDrawnPairs {
  return {
    beginner: result.beginner.map((pair) => ({
      ...pair,
      games: pair.games ?? [],
    })),
    advanced: result.advanced.map((pair) => ({
      ...pair,
      games: pair.games ?? [],
    })),
  };
}

