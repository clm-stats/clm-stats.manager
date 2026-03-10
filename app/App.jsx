import {
  useEffect,
  useState,
  Component,
  useContext,
  createContext,
} from "react";
import cn from "classnames";
import consts from "#lib/consts";
import { FaUsersGear, FaFileCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { FaCheckCircle, FaClock } from "react-icons/fa";
import { LuCalendarCog } from "react-icons/lu";
import { ImStatsDots } from "react-icons/im";
import { MdAdminPanelSettings } from "react-icons/md";
import { IoBuild } from "react-icons/io5";

const XContext = createContext();
const useX = () => useContext(XContext);

const _c1 = `https://discord.com/oauth2/authorize?response_type=code`;
const _c2 = `&client_id=${consts.clientId}&scope=${encodeURIComponent(consts.scope)}`;
const _c3 = `&redirect_uri=${encodeURIComponent(consts.redirect_uri)}`;
const connectLink = _c1 + _c2 + _c3;

function Cn(...args) {
  return { className: cn(...args) };
}

const url = new URL(window.location.href);
const urlIdent = url.searchParams.get("authedIdent");
if (urlIdent) {
  window.localStorage.setItem("authedIdent", urlIdent);
  url.searchParams.delete("authedIdent");
  window.history.replaceState(null, "", url);
}
const initialIdent = localStorage.getItem("authedIdent");

function toDateStr(ts, isT) {
  const optsT = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  const optsD = { month: "2-digit", day: "2-digit" };
  return new Intl.DateTimeFormat("en-US", isT ? optsT : optsD).format(ts);
}

function eventsList(X) {
  return (
    <div className="flex flex-col">
      {Object.values(X.specEvents).map((event, ind) => {
        const dateStr = toDateStr(event.date * 1000);
        const isOdd = ind % 2 === 1;
        return (
          <div
            key={event.id}
            className={cn(
              "text-sm font-bold mx-0 my-0 py-0 flex items-center",
              isOdd ? "bg-base-300" : "bg-base-100",
            )}
          >
            <div
              className="group inline-flex pl-2 cursor-pointer relative h-10 py-2 mr-2"
              onClick={() => X.toggleEligibility(event)}
            >
              <label
                className={cn(
                  "swap swap-rotate rounded-box shadow-sm",
                  "border-gray-300 bg-white px-2",
                  "dark:border-gray-700 dark:bg-black",
                  "pointer-events-none relative",
                )}
              >
                <div
                  className={cn(
                    "absolute opacity-0 bg-warning/50",
                    "w-[calc(100%+0.5rem)] h-[calc(100%+0.25rem+1px)]",
                    "-left-2 top-[calc(-0.25rem_-_1px)] rounded-box",
                    "transition transition-opacity duration-300",
                    "border-1 border-black dark:border-white",
                    { "opacity-25": X.isEligibilityToggled(event) },
                  )}
                />

                <input type="checkbox" checked={X.isPrEligible(event)} />
                <div className="swap-on text-success">
                  <FaCheckCircle />{" "}
                </div>
                <div className="swap-off text-error">
                  <FaCircleXmark />{" "}
                </div>
              </label>
              <span
                className={cn(
                  "opacity-20 group-hover:opacity-100",
                  "absolute top-3 -left-6",
                  {
                    "opacity-100 text-warning italic":
                      X.isEligibilityToggled(event),
                  },
                  X.isEligibilityToggled(event) ? "text-xs" : "text-[0.625rem]",
                  "group-hover:text-xs",
                )}
              >
                &nbsp;PR?
              </span>
            </div>
            &nbsp;
            <span className="opacity-50">{dateStr}</span>
            &nbsp;
            <span className="min-w-8 whitespace-nowrap overflow-hidden text-ellipsis">
              {event.tournamentName}
            </span>
            &nbsp;
            <span className="opacity-50 whitespace-nowrap overflow-hidden text-ellipsis min-w-4">
              {event.name}
            </span>
            <span className="flex-1" />
            &nbsp;
            <span
              className={cn(
                "opacity-50 underline whitespace-nowrap cursor-pointer",
                "hover:opacity-100",
              )}
            >
              [0] 🎭 ⌄
            </span>
            &nbsp; &nbsp;
          </div>
        );
      })}
      <div className="h-10" />
    </div>
  );
}

// "card rounded-md shadow-md ml-4 shadow-neutral/30",
// "border-1 border-gray-200 dark:border-gray-800",
function FullApp() {
  const [openBuildModal, _setOpenBuildModal] = useState(false);
  const [startBuildError, setStartBuildError] = useState();

  const [_tab, setTab] = useState();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const tab = new Set(["players", "season"]).has(_tab) ? _tab : "season";
  const X = useX();
  const setOpenBuildModal = (arg) => _setOpenBuildModal(X.isBuilding || arg);

  useEffect(() => X.isBuilding && setOpenBuildModal(true), [X.isBuilding]);

  const startBuild = () => {
    fetch("/api/build")
      .then((res) => res.json())
      .then(({ status }) => {
        X.setBuild(status);
        X.reload();
      })
      .catch(() => {
        setStartBuildError("unknown network error");
      });
  };

  const authedIdent = !X.hasLoaded ? initialIdent : X.userIdent;
  const isAuthed = Boolean(X.hasLoaded && authedIdent);
  const isUnauthed = Boolean(X.hasLoaded && !authedIdent);
  const body = (() => {
    if (isAuthed) {
      return (
        <div className="flex flex-col absolute top-0 left-0 h-full w-full">
          <div className="relative h-full">
            <div
              className={cn(
                "absolute top-0 left-8 w-[calc(100%_-_4rem)] h-full z-20",
                "border-1 rounded-box border-gray-200 dark:border-gray-800",
                "pointer-events-none",
              )}
            ></div>
            <div className={cn("max-h-full overflow-scroll px-8 relative")}>
              <div className={cn()}>{eventsList(X)}</div>
            </div>
          </div>
        </div>
      );
    }
    if (isUnauthed) {
      return (
        <a
          href={connectLink}
          key="login-modal"
          className={cn(
            "flex flex-col max-w-70 min-w-70 group-hover btn",
            "btn-soft btn-primary self-center absolute min-h-60 max-h-60",
            "top-[50%] translate-y-[-50%] rounded-box shadow-xl box ",
            "border-1 border-base-300 items-stretch px-0 gap-0",
            "animate animate-once animate-jump-in",
          )}
        >
          <div className="py-2 text-error">NO LOGIN FOUND</div>
          <div
            {...Cn(
              "bg-primary/90 flex-1 text-primary-content prose p-5 flex items-center",
              "border-t-1 border-b-1 border-black/30 dark:border-white/30 inset-shadow-sm",
            )}
          >
            <p>
              Click to login with your Discord account. If you are supposed to
              have admin access, you will be let in based on that
            </p>
          </div>
          <div className="py-3">login w/ Discord</div>
        </a>
      );
    }
    return (
      <div className="flex flex-col gap-2 p-8">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-6 w-41" />
        <div className="skeleton h-6 w-68" />
        <div className="skeleton h-6 w-52" />
        <div className="skeleton h-6 w-44" />
      </div>
    );
  })();

  useEffect(() => {
    if (authedIdent) {
      window.localStorage.setItem("authedIdent", authedIdent);
    } else {
      window.localStorage.removeItem("authedIdent");
    }
  }, [authedIdent]);

  return (
    <div className="bg-base-300 relative">
      <div
        {...Cn(
          "container rounded-none min-h-screen mx-auto card relative",
          "bg-base-200 shadow-xl mx-4 my-0",
        )}
      >
        <nav
          {...Cn(
            "animate animate-once animate-fade-down navbar absolute z-20 w-full top-0 bg-base-100 border-b-2 border-base-300 shadow-sm",
          )}
        >
          <div className="navbar-start join ml-1">
            <a
              href="/"
              {...Cn("join-item btn border-r-1 border-r-base-300 text-xs", {})}
            >
              <MdAdminPanelSettings />
              <span className="hidden lg:inline">&nbsp;Admin Home</span>
            </a>
            <a
              href="https://clm-stats.github.io"
              target="_blank"
              className="join-item btn border-l-1 border-r-1 border-l-base-300 border-r-base-300 text-xs"
            >
              <ImStatsDots />
              <span className="hidden lg:inline">&nbsp;CLM Stats</span>
            </a>
            <a
              href="https://chicagomelee.com"
              target="_blank"
              className="join-item btn border-l-1 border-l-base-300 text-xs"
            >
              <img className="w-5 h-5" src="/favicon.ico" />
              <span className="hidden lg:inline">&nbsp;chicagomelee.com</span>
            </a>
          </div>
          <div
            {...Cn("navbar-end transition-opacity transition duration-300", {
              "pointer-events-none opacity-70": !isAuthed,
            })}
          >
            <ul className="join flex-horizontal mr-1">
              <li
                className={cn(
                  "transition transition-colors duration-300 join-item btn px-2",
                  {
                    "bg-primary/20": tab === "season",
                  },
                )}
                onClick={() => setTab("season")}
              >
                <a className="p-1 px-2 flex min-h-6 font-bold text-xs">
                  <span className="h-4 flex items-center">
                    <LuCalendarCog className="h-4" />
                  </span>
                  <span className="hidden lg:inline">&nbsp;Manage Events</span>
                </a>
              </li>
              <li
                className={cn(
                  "transition transition-colors duration-300 join-item btn px-2",
                  {
                    "bg-primary/20": tab === "players",
                  },
                )}
                onClick={() => setTab("players")}
              >
                <a className="p-1 px-2 flex min-h-6 font-bold text-xs">
                  <span className="h-4 flex items-center">
                    <FaUsersGear />
                  </span>
                  <span className="hidden lg:inline">&nbsp;Manage Players</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>
        <div {...Cn("mt-22 mb-16 flex flex-col flex-1 relative")}>{body}</div>
        <div
          {...Cn(
            "absolute z-20 w-full bottom-[2px] h-10 bg-base-200 border-t-2 border-base-300 shadow-sm",
            "animate animate-once animate-fade-up flex items-center px-4 justify-between",
            { hidden: !authedIdent },
          )}
        >
          <div className="transition transition-colors duration-300 group btn btn-soft btn-accent hover:btn-error h-8 rounded-full pr-6 pl-0 border-l-0 shadow-sm overflow-hidden border-0">
            <div
              {...Cn(
                "h-8 w-8 bg-black/20 dark:bg-white/20 rounded-full rounded-l-none overflow-hidden",
                "transition transition-opacity transition-colors duration-300 opacity-100 group-hover:opacity-70",
                "inset-shadow-sm",
              )}
            >
              <img
                className="border-1 border-primary/40 bg-info relative rounded-full overflow-hidden top-px left-px h-[calc(100%_-_2px)] w-[calc(100%_-_2px)]"
                src={authedIdent && consts.getIconUrl(authedIdent)}
              />
            </div>
            <button
              onClick={() => {
                X.logout();
              }}
            >
              <span className="relative">
                <span className="text-center transition transition-opacity transition-colors duration-300 opacity-100 inline-block min-w-11 group-hover:opacity-0">
                  {X.userDiscordName || (
                    <div className="skeleton h-4 w-10 relative top-[0.25rem] left-[0.375rem]" />
                  )}
                </span>
                <span className="text-left transition transition-opacity transition-colors duration-300 opacity-0 group-hover:opacity-100 absolute top-0 left-0 h-full flex items-center">
                  logout
                </span>
              </span>
            </button>
          </div>
          <div className={cn("flex gap-2 items-center", { hidden: !X.build })}>
            {!startBuildError ? null : (
              <div className="text-error">{startBuildError}</div>
            )}
            {!X.build || !X.build.lastHash ? null : (
              <a
                href={`https://github.com/clm-stats/clm-stats.github.io/#${X.build.lastHash}`}
                className="btn btn-link link"
              >
                #{X.build.lastHash}
              </a>
            )}
            {!X.build || !X.build.lastFinish ? null : (
              <div className="text-sm text-info inline-flex items-center">
                <FaClock /> &nbsp; {toDateStr(X.build.lastFinish, true)}
                &nbsp; &nbsp;
                <FaCheckCircle className="text-success" />
                &nbsp;
              </div>
            )}
            <button
              className={cn(
                "badge badge-sm text-md badge-soft",
                "leading-none self-center cursor-pointer hover:badge-primary",
                "transition transition-colors duration-300 p-4 m-0",
                {
                  "badge-accent": X.canBuild,
                  "badge-warning": X.isBuilding,
                  "badge-error": X.buildError,
                  "badge-success opacity-70 pointer-events-none":
                    !X.canBuild && !X.isBuilding && !X.buildError,
                },
              )}
              onClick={() => {
                if (X.canBuild) {
                  startBuild();
                }
                setOpenBuildModal(true);
              }}
            >
              <span>
                {(() => {
                  if (X.canBuild) {
                    return "Start Build";
                  } else if (X.isBuilding) {
                    return (
                      <span className="inline-flex">
                        <IoBuild /> &nbsp; In Progress...
                      </span>
                    );
                  } else if (X.buildError) {
                    return "Build Error";
                  } else {
                    return (
                      <span className="inline-flex">
                        <FaCheckCircle /> &nbsp; cooldown
                      </span>
                    );
                  }
                })()}
              </span>
            </button>
          </div>
        </div>
      </div>

      <input
        type="checkbox"
        className="modal-toggle"
        checked={openBuildModal}
      />
      <div className="modal" role="dialog">
        {!X.build ? null : (
          <div className="modal-box p-4">
            <h3 className="text-lg font-bold inline-flex items-center">
              Build Status &nbsp;
              {(() => {
                if (X.isBuilding) {
                  return <IoBuild className="animate animate-pulse" />;
                } else if (!X.buildError) {
                  return <FaCheckCircle className="text-success" />;
                } else {
                  return <FaCircleXmark className="text-error" />;
                }
              })()}
            </h3>
            <div className="pt-4">
              <div className="bg-base-300 border-1 border-black rounded-sm flex flex-col">
                <div
                  key="header"
                  className={cn(
                    "text-sm font-mono font-bold py-1 bg-info/10 text-center",
                  )}
                >
                  Build Command Log
                </div>
                <div className="flex flex-col overflow-scroll max-h-[calc(100vh_-_14rem)]">
                  {X.build.io.map((line, ind) => (
                    <div
                      key={ind}
                      className={cn(
                        "text-sm font-mono",
                        "border-t-1 border-black py-1",
                      )}
                    >
                      <span className="opacity-50">&nbsp;{ind}</span>&nbsp;
                      {line}
                    </div>
                  ))}
                  {!X.buildError ? null : (
                    <div
                      key="error"
                      className={cn(
                        "animate animate-once animate-fade-up text-sm font-mono",
                        "border-b-1 border-black py-1",
                      )}
                    >
                      error {JSON.stringify(X.buildError)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-action mt-4 ">
              <div className="join">
                <button
                  className={cn("join-item btn btn-accent btn-soft", {
                    "btn-disabled": !X.canBuild,
                  })}
                >
                  {X.canBuild
                    ? "Start Build"
                    : X.isBuilding
                      ? "in progress..."
                      : "wait 5 mins before next build"}
                </button>
                <label
                  onClick={() => setOpenBuildModal(false)}
                  className={cn("btn join-item btn-soft", {
                    "btn-disabled": X.isBuilding,
                  })}
                >
                  <FaCircleXmark />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

let refreshCount = 1;

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { refreshCount };
    this.isLoading = true;
    this.eventEligibilityToggles = new Set([]);
  }

  refresh() {
    refreshCount++;
    this.setState({ refreshCount });
  }

  handleStatus(status) {
    this.isLoading = false;
    if (
      !this.fetchedStatus ||
      !status ||
      (this.fetchStatus && !this.fetchStatus[0])
    ) {
      this.fetchedStatus = [status];
    } else {
      Object.assign(this.fetchStatus[0], status);
    }
    this.refresh();
  }

  fetchStatus(logout = false) {
    const shouldRefresh = !this.isLoading;
    this.isLoading = true;
    this.lastRequest = Date.now();
    fetch(`/api/status${logout ? "?logout=1" : ""}`)
      .then((res) => res.json())
      .then((status) => this.handleStatus(status))
      .catch(console.error);
    if (shouldRefresh) {
      this.refresh();
    }
  }

  componentDidMount() {
    this.fetchStatus();
    window.setInterval(() => {
      const delta = Date.now() - this.lastRequest;
      if (this.build && this.build.isBuilding && delta > 2000) {
        this.fetchStatus();
      } else if (delta > 15000) {
        this.fetchStatus();
      }
    }, 500);
  }

  get hasLoaded() {
    return !!this.fetchedStatus;
  }

  onStatus(f) {
    return this.fetchedStatus && f(this.fetchedStatus[0]);
  }

  get user() {
    return this.onStatus((s) => s.user);
  }

  get userIdent() {
    return this.user && this.user.ident;
  }

  get userDiscordName() {
    return this.user && this.user.discordName;
  }

  get builtActions() {
    return this.onStatus((s) => s.actions) || [];
  }

  get specEvents() {
    return this.onStatus((s) => s.events) || {};
  }

  get build() {
    return this.onStatus((s) => s.build);
  }

  setBuild(buildStatus) {
    this.onStatus((s) => {
      s.build = buildStatus;
      this.refresh();
    });
  }

  get canBuild() {
    return this.build ? this.build.canBuild : false;
  }

  get isBuilding() {
    return this.build ? this.build.isBuilding : false;
  }

  get buildError() {
    return this.build ? this.build.error : null;
  }

  isEligibilityToggled(event) {
    return this.eventEligibilityToggles.has(event.id);
  }

  toggleEligibility(event) {
    if (this.isEligibilityToggled(event)) {
      this.eventEligibilityToggles.delete(event.id);
    } else {
      this.eventEligibilityToggles.add(event.id);
    }
    this.refresh();
  }

  render() {
    /*
     const contextVal = {
       isLoading: boolean,
       hasLoaded: boolean,
       user?: {},
       spec: {},
       lastBuildTime: int,
     }
     */
    console.log(this.build);
    const contextVal = {
      build: this.build,
      setBuild: (buildStatus) => this.setBuild(buildStatus),
      canBuild: this.canBuild,
      isBuilding: this.isBuilding,
      buildError: this.buildError,
      isLoading: this.isLoading,
      hasLoaded: this.hasLoaded,
      user: this.user,
      userIdent: this.userIdent,
      userDiscordName: this.userDiscordName,
      builtActions: this.builtActions,
      specEvents: this.specEvents,
      isEligibilityToggled: (event) => this.isEligibilityToggled(event),
      toggleEligibility: (event) => this.toggleEligibility(event),
      isPrEligible: (event) =>
        (this.isEligibilityToggled(event) ? (a) => !a : (a) => a)(
          event.prEligible,
        ),
      logout: () => this.fetchStatus(true),
      reload: () => this.fetchStatus(),
    };
    return (
      <XContext.Provider value={contextVal}>
        <FullApp />
      </XContext.Provider>
    );
  }
}
