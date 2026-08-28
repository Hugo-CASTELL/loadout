import {useNavigate} from "react-router";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div>
      Main page

      After log-in : <button onClick={() => navigate("/loadout/me")}>Go to /loadout/me</button>
    </div>
  );
}
