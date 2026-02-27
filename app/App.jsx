import { useEffect, useState } from "react";
import consts from "#lib/consts";

function reloadStatus(res) {
  res.isLoading = true;
  res.future = fetch("/api/status")
    .then((res) => res.json())
    .then((status) =>
      Object.assign(res, status, { isLoading: false, fetchError: null }),
    )
    .catch((fetchError) => Object.assign(res, { isLoading: true, fetchError }))
    .finally(() => {
      for (const subId in res.subs) {
        res.subs[subId](res);
      }
    });
}

const statusState = (() => {
  const res = { subs: {}, nextSubId: 1, sub: () => {} };
  reloadStatus(res);
  res.reload = () => reloadStatus(res);
  res.sub = (handle) => {
    const subId = res.nextSubId++;
    res.subs[subId] = handle;
    return () => {
      delete res.subs[subId];
    };
  };
  return res;
})();

function useStatus() {
  const [state, setState] = useState([statusState]);
  const updateState = () => setState([statusState]);
  useEffect(() => statusState.sub(updateState), []);
  return state[0];
}

const _c1 = `https://discord.com/oauth2/authorize?response_type=code`;
const _c2 = `&client_id=${consts.clientId}&scope=${encodeURIComponent(consts.scope)}`;
const _c3 = `&redirect_uri=${encodeURIComponent(consts.redirect_uri)}`;
const connectLink = _c1 + _c2 + _c3;

export default function App() {
  const st = useStatus();
  console.log(st.isLoading);
  console.log(st.actions);
  return (
    <div>
      <div className="prose">
        <h3>Hello World</h3>
      </div>
      <a href={connectLink} className="btn btn-soft btn-accent">
        login via oauth
      </a>
    </div>
  );
}
