import { auth } from "../firebase/firebaseConfig";
import { useGroup } from "../contexts/GroupContext";
import FeedbackForm from "../components/FeedbackForm";

function Feedback() {
  const { grupo } = useGroup();
  const user = auth.currentUser;

  if (!user || !grupo) {
    return <div className="container mt-4">Cargando...</div>;
  }

  return (
    <div className="py-4">
      <div className="mb-4">
        <h2 className="h4 mb-1">Feedback del viaje</h2>
        <p className="text-muted mb-0">
          Comparte tu opinión sobre el viaje o sobre la aplicación TripSync. La IA analizará el tono de tu mensaje.
        </p>
      </div>

      <FeedbackForm
        userEmail={user.email ?? ""}
        userId={user.uid}
      />
    </div>
  );
}

export default Feedback;
