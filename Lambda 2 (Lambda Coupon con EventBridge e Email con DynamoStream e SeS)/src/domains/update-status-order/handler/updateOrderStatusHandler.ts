import { updateOrderStatus } from "../services/updateOrderStatusService";

export const handler = async (_event: unknown) => {
  try {
    await updateOrderStatus();
    console.log("Stato ordini aggiornato con successo");
    return { body: JSON.stringify({ message: "Order status updated" }) };
  } catch (error) {
    console.error("Errore nell'aggiornamento stato ordini:", error);
    return { body: JSON.stringify({ message: "Errore interno" }) };
  }
};
