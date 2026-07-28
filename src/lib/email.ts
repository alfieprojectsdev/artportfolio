import { Resend } from 'resend';
import { escapeHtml, phpToUsd, formatSiteDateTime } from './utils';
import { env, fromEmail, siteUrl } from './env';
import { DEFAULT_SITE_SETTINGS } from './settings';

// Lazy-initialize Resend client to avoid issues when API key is not set
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * The artist's inbox. No fallback on purpose.
 *
 * This used to default to `bred@example.com`. example.com is IANA-reserved and
 * never delivers, so an unset ARTIST_EMAIL meant Resend accepted the send,
 * returned an id, this function reported success, and the artist never heard
 * that a commission had come in. Silent loss on the one path that matters.
 */
function getArtistEmail(): string | null {
  return env.ARTIST_EMAIL ?? null;
}

function getFromEmail(): string {
  return fromEmail();
}

interface CommissionEmailData {
  id: number;
  clientName: string;
  email: string;
  discord?: string | null;
  artType: string;
  style?: string | null;
  description: string;
  estimatedPrice?: number | null;
  refImages?: string[];
}

/**
 * Send notification to artist when a new commission is submitted
 */
export async function sendNewCommissionNotification(
  commission: CommissionEmailData,
  artistName: string = DEFAULT_SITE_SETTINGS.artistName
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log('RESEND_API_KEY not set, skipping email notification');
    return false;
  }

  const artistEmail = getArtistEmail();
  if (!artistEmail) {
    console.error(
      `[email] ARTIST_EMAIL is not set — cannot notify the artist about commission #${commission.id} ` +
        `from ${commission.clientName}. The request IS saved and visible in /admin, but no email was sent.`
    );
    return false;
  }

  try {
    const refImagesHtml = commission.refImages && commission.refImages.length > 0
      ? `<p><strong>Reference Images:</strong> ${commission.refImages.length} attached</p>
         <div style="display: flex; gap: 10px; flex-wrap: wrap;">
           ${commission.refImages.map(url => {
             const escapedUrl = escapeHtml(url);
             const optimizedUrl = escapeHtml(url.replace('/upload/', '/upload/w_100,h_100,c_fill/'));
             return `<a href="${escapedUrl}" target="_blank"><img src="${optimizedUrl}" alt="Reference" style="border-radius: 8px;"></a>`;
           }).join('')}
         </div>`
      : '';

    const { data, error } = await resend.emails.send({
      from: `Commission Bot <${getFromEmail()}>`,
      to: [artistEmail],
      // Hitting reply goes to the client, not to the bot address.
      replyTo: commission.email,
      subject: `New Commission Request from ${commission.clientName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #916A5D; margin-bottom: 20px;">New Commission Request!</h1>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Client Information</h2>
            <p><strong>Name:</strong> ${escapeHtml(commission.clientName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(commission.email)}">${escapeHtml(commission.email)}</a></p>
            ${commission.discord ? `<p><strong>Discord:</strong> ${escapeHtml(commission.discord)}</p>` : ''}
          </div>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Commission Details</h2>
            <p><strong>Type:</strong> ${escapeHtml(commission.artType)}</p>
            ${commission.style ? `<p><strong>Style:</strong> ${escapeHtml(commission.style)}</p>` : ''}
            ${commission.estimatedPrice ? `<p><strong>Estimated Price:</strong> ₱${commission.estimatedPrice}</p>` : ''}
          </div>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Description</h2>
            <p style="white-space: pre-wrap;">${escapeHtml(commission.description)}</p>
          </div>

          ${refImagesHtml}

          <div style="margin-top: 30px; text-align: center;">
            <a href="${siteUrl()}/admin"
               style="background: #916A5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              View in Admin Panel
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
            Commission #${commission.id} - Submitted ${formatSiteDateTime()}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send commission notification:', error);
      return false;
    }

    console.log('Commission notification sent:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending commission notification:', error);
    return false;
  }
}

/**
 * Send confirmation email to client when their commission is submitted
 */
export async function sendCommissionConfirmation(
  commission: CommissionEmailData,
  artistName: string = DEFAULT_SITE_SETTINGS.artistName
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log('RESEND_API_KEY not set, skipping confirmation email');
    return false;
  }

  const replyTo = getArtistEmail();

  try {
    const { data, error } = await resend.emails.send({
      from: `${artistName}'s Commissions <${getFromEmail()}>`,
      to: [commission.email],
      // Client replies reach the artist, not the send-only from address.
      ...(replyTo ? { replyTo } : {}),
      subject: 'Commission Request Received!',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #916A5D; margin-bottom: 20px;">Thank you for your commission request!</h1>

          <p>Hi ${escapeHtml(commission.clientName)},</p>

          <p>I've received your commission request and will review it soon. Here's a summary of what you submitted:</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p><strong>Type:</strong> ${escapeHtml(commission.artType)}</p>
            ${commission.style ? `<p><strong>Style:</strong> ${escapeHtml(commission.style)}</p>` : ''}
            ${commission.estimatedPrice ? `<p><strong>Estimated Price:</strong> ₱${commission.estimatedPrice} (~$${phpToUsd(commission.estimatedPrice)} USD)</p>` : ''}
          </div>

          <p><strong>Your request:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(commission.description)}</p>

          <p style="margin-top: 20px;">I typically respond within <strong>1-3 business days</strong>. If your request is accepted, I'll reach out to discuss the details and payment.</p>

          <p>Feel free to reply to this email if you have any questions!</p>

          <p style="margin-top: 30px;">
            Best,<br>
            <strong style="color: #916A5D;">${escapeHtml(artistName)}</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <p style="color: #666; font-size: 12px;">
            Reference ID: #${commission.id}<br>
            This is an automated confirmation email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send confirmation email:', error);
      return false;
    }

    console.log('Confirmation email sent:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}

/**
 * Send status update email to client
 */
export async function sendStatusUpdateEmail(
  clientEmail: string,
  clientName: string,
  commissionId: number,
  newStatus: string,
  notes?: string,
  artistName: string = DEFAULT_SITE_SETTINGS.artistName
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log('RESEND_API_KEY not set, skipping status update email');
    return false;
  }

  const statusMessages: Record<string, { subject: string; message: string }> = {
    accepted: {
      subject: 'Your Commission Has Been Accepted!',
      message: 'Great news! Your commission request has been accepted. I will reach out soon to discuss the details and payment.',
    },
    in_progress: {
      subject: 'Your Commission is Now In Progress',
      message: 'I\'ve started working on your commission! I\'ll send you updates as I make progress.',
    },
    completed: {
      subject: 'Your Commission is Complete!',
      message: 'Your commission is finished! Please check your email for the final artwork.',
    },
    declined: {
      subject: 'Commission Request Update',
      message: 'Unfortunately, I won\'t be able to take on your commission at this time. Thank you for your interest, and I hope to work with you in the future.',
    },
  };

  const statusInfo = statusMessages[newStatus];
  if (!statusInfo) {
    return false; // Don't send email for unknown status
  }

  const replyTo = getArtistEmail();

  try {
    const { data, error } = await resend.emails.send({
      from: `${artistName}'s Commissions <${getFromEmail()}>`,
      to: [clientEmail],
      // Client replies reach the artist, not the send-only from address.
      ...(replyTo ? { replyTo } : {}),
      subject: statusInfo.subject,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #916A5D; margin-bottom: 20px;">${statusInfo.subject}</h1>

          <p>Hi ${escapeHtml(clientName)},</p>

          <p>${statusInfo.message}</p>

          ${notes ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Note from ${escapeHtml(artistName)}:</strong>
            <p style="margin: 10px 0 0;">${escapeHtml(notes)}</p>
          </div>
          ` : ''}

          <p style="margin-top: 30px;">
            Best,<br>
            <strong style="color: #916A5D;">${escapeHtml(artistName)}</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <p style="color: #666; font-size: 12px;">
            Reference ID: #${commissionId}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send status update email:', error);
      return false;
    }

    console.log('Status update email sent:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending status update email:', error);
    return false;
  }
}
