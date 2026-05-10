import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Surrealbox <onboarding@resend.dev>";

interface BookingEmailProps {
    to: string;
    userName: string;
    serviceName: string;
    startTime: Date;
    price?: number;
}

/**
 * Sends a booking confirmation email to the user.
 */
export async function sendBookingConfirmation({
    to,
    userName,
    serviceName,
    startTime,
    price,
}: BookingEmailProps) {
    return await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Booking Confirmed: ${serviceName}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h1>Booking Confirmed!</h1>
                <p>Hi ${userName},</p>
                <p>Your appointment for <strong>${serviceName}</strong> has been successfully booked.</p>
                <ul>
                    <li><strong>Date & Time:</strong> ${startTime.toLocaleString()}</li>
                    ${price ? `<li><strong>Price:</strong> ₹${(price / 100).toFixed(2)}</li>` : ""}
                </ul>
                <p>Thank you for choosing us!</p>
            </div>
        `,
    });
}

/**
 * Sends a booking cancellation email to the user.
 */
export async function sendBookingCancellation({
    to,
    userName,
    serviceName,
    startTime,
}: Omit<BookingEmailProps, "price">) {
    return await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Booking Cancelled: ${serviceName}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h1>Booking Cancelled</h1>
                <p>Hi ${userName},</p>
                <p>Your appointment for <strong>${serviceName}</strong> on ${startTime.toLocaleString()} has been cancelled.</p>
                <p>If you have any questions, please contact the stylist directly.</p>
            </div>
        `,
    });
}