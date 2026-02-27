import { useEffect, useState } from "react";

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

export default function App() {
  const st = useStatus();
  console.log(st.isLoading);
  console.log(st.actions);
  return <div>Hello World</div>;
}
