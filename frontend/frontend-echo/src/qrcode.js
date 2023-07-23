import React from "react";
import QRCode from "qrcode.react";

function TransactionQRCode({ transactionData }) {
    // Convertir los datos de la transacción a una cadena JSON
    const data = JSON.stringify(transactionData);

    return <QRCode value={data} />;
}

export default TransactionQRCode;
