import {
  useEffect,
  useState,
  Component,
  useContext,
  createContext,
} from "react";
import cn from "classnames";
import consts from "#lib/consts";
import { FaUsersGear, FaFileCircleCheck } from "react-icons/fa6";
// import { FaHome } from "react-icons/fa";
import { LuCalendarCog } from "react-icons/lu";
import { ImStatsDots } from "react-icons/im";
import { MdAdminPanelSettings } from "react-icons/md";

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

function FullApp() {
  const [_tab, setTab] = useState();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const tab = new Set(["players", "season"]).has(_tab) ? _tab : "build";
  const X = useX();
  const authedIdent = !X.hasLoaded ? initialIdent : X.userIdent;
  const isAuthed = Boolean(X.hasLoaded && authedIdent);
  const isUnauthed = Boolean(X.hasLoaded && !authedIdent);
  const body = (() => {
    if (isAuthed) {
      return <div>welcome, {X.userDiscordName}</div>;
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
    return null;
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
                    "bg-primary/20": tab === "build",
                  },
                )}
                onClick={() => setTab("build")}
              >
                <a className="p-1 px-2 flex min-h-6 font-bold text-xs">
                  <span className="h-4 flex items-center">
                    <FaFileCircleCheck className="h-4" />
                  </span>
                  <span className="hidden lg:inline">&nbsp;Build Status</span>
                </a>
              </li>
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
                  <span className="hidden lg:inline">&nbsp;Manage Season</span>
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
        <div {...Cn("mt-16 mb-10 flex flex-col")}>{body}</div>
        <div
          {...Cn(
            "absolute z-20 w-full bottom-0 h-10 bg-base-200 border-t-2 border-base-300 shadow-sm",
            "animate animate-once animate-fade-up flex items-center px-4",
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
                X.reload(true);
              }}
            >
              <span className="relative">
                <span className="text-center transition transition-opacity transition-colors duration-300 opacity-100 inline-block min-w-11 group-hover:opacity-0">
                  {X.userDiscordName}
                </span>
                <span className="text-left transition transition-opacity transition-colors duration-300 opacity-0 group-hover:opacity-100 absolute top-0 left-0 h-full flex items-center">
                  logout
                </span>
              </span>
            </button>
          </div>
          <button
            className="btn btn-primary ml-8"
            onClick={() =>
              fetch("/api/test")
                .then((res) => res.json())
                .then(console.log)
                .catch(console.error)
            }
          >
            TEST
          </button>
        </div>
      </div>
    </div>
  );
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { refreshCount: 1 };
    this.isLoading = true;
  }

  refresh() {
    this.setState({ refreshCount: this.state.refreshCount + 1 });
  }

  handleStatus(status) {
    this.isLoading = false;
    this.fetchedStatus = [status];
    this.refresh();
  }

  componentDidMount() {
    fetch("/api/status")
      .then((res) => res.json())
      .then((status) => this.handleStatus(status))
      .catch(console.error);
  }

  get hasLoaded() {
    return !!this.fetchedStatus;
  }

  get user() {
    return this.fetchedStatus && this.fetchedStatus[0].user;
  }

  get userIdent() {
    return this.user && this.user.ident;
  }
  get userDiscordName() {
    return this.user && this.user.discordName;
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
    const contextVal = {
      isLoading: this.isLoading,
      hasLoaded: this.hasLoaded,
      user: this.user,
      userIdent: this.userIdent,
      userDiscordName: this.userDiscordName,
    };
    return (
      <XContext.Provider value={contextVal}>
        <FullApp />
      </XContext.Provider>
    );
  }
}
