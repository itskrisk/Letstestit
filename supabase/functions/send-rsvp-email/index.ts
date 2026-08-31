import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────
//  EXECUTIVE SIGN-OFF BLOCK
// ─────────────────────────────────────────────────
const execSignoffBlock = `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="88%" style="margin-top:20px;">
  <tr>
    <td class="exec-col" valign="top" width="50%" align="right" style="padding-right:20px;">
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#0A192F;">Dean Ndere</div>
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:9.5px;font-weight:700;color:#0066CC;text-transform:uppercase;letter-spacing:1.2px;margin-top:3px;">CEO &amp; Founder</div>
    </td>
    <td class="exec-col" valign="top" width="50%" align="left" style="padding-left:20px;border-left:1px solid #e8ecf0;">
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#0A192F;">Kris Kamau</div>
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:9.5px;font-weight:700;color:#0066CC;text-transform:uppercase;letter-spacing:1.2px;margin-top:3px;">CTO &amp; Co-founder</div>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center" style="padding-top:20px;">
      <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10.5px;font-weight:700;color:#0A192F;letter-spacing:1.8px;text-transform:uppercase;">
        Muncheez Technologies Inc.
      </span>
    </td>
  </tr>
</table>
`;

// ─────────────────────────────────────────────────
//  CONFIRMED EMAIL TEMPLATE
// ─────────────────────────────────────────────────
function buildConfirmedEmail(name: string, eventDate: string, guestLine: string): string {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Muncheez — You're Confirmed</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse!important;}
body{margin:0!important;padding:0!important;width:100%!important;background-color:#ffffff;}
@media screen and (max-width:620px){
  .email-wrap{width:100%!important;}
  .monogram{font-size:26px!important;}
  .salutation{font-size:19px!important;}
  .body-cell{width:94%!important;}
  .exec-col{display:block!important;width:100%!important;text-align:center!important;padding:10px 0!important;border:none!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:56px 16px 64px 16px;">
<table class="email-wrap" role="presentation" width="560" cellpadding="0" cellspacing="0" border="0">

  <!-- MONOGRAM -->
  <tr><td align="center" style="padding-bottom:6px;">
    <span class="monogram" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:32px;font-weight:700;color:#0A192F;letter-spacing:-0.5px;line-height:1;">
      Muncheez<span style="color:#0066CC;">.</span>
    </span>
  </td></tr>
  <tr><td align="center" style="padding-bottom:30px;">
    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#0066CC;text-transform:uppercase;letter-spacing:2.5px;">
      You're In The Room
    </span>
  </td></tr>

  <!-- Accent dot -->
  <tr><td align="center" style="padding-bottom:34px;">
    <span style="display:inline-block;width:5px;height:5px;background-color:#0A192F;border-radius:50%;font-size:0;line-height:0;">&nbsp;</span>
  </td></tr>

  <!-- SALUTATION -->
  <tr><td align="center" style="padding-bottom:30px;">
    <span class="salutation" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#0A192F;letter-spacing:-0.2px;line-height:1.2;">
      Dear ${name},
    </span>
  </td></tr>

  <!-- BODY -->
  <tr><td align="center">
    <table class="body-cell" role="presentation" width="88%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center">
        <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#2D3748;line-height:1.85;margin:0 0 18px 0;text-align:center;">
          Your attendance has been confirmed. You are now part of a select circle witnessing the beginning of something built specifically for this city — and we do not use that word lightly.
        </p>
        <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#2D3748;line-height:1.85;margin:0;text-align:center;">
          Your event details are below. We look forward to having you in the room.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- EVENT DETAILS -->
  <tr><td align="center" style="padding-top:42px;padding-bottom:42px;">
    <table role="presentation" width="88%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" style="padding-bottom:12px;">
        <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#0A192F;text-transform:uppercase;letter-spacing:2.5px;">
          Your Access Details
        </span>
      </td></tr>
      <tr><td align="center" style="padding-bottom:8px;">
        <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#0066CC;">
          ${eventDate}
        </span>
      </td></tr>
      <tr><td align="center" style="padding-bottom:8px;">
        <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#2D3748;">
          Google Meet &nbsp;&middot;&nbsp; Private Calendar Link Forthcoming
        </span>
      </td></tr>
      ${guestLine}
    </table>
  </td></tr>

  <!-- SIGN-OFF -->
  <tr><td align="center" style="padding-bottom:20px;">
    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#2D3748;line-height:1.6;">With great anticipation,</span>
  </td></tr>

  <!-- EXECUTIVE FOUNDERS BLOCK -->
  <tr><td align="center" style="padding-bottom:48px;">
    ${execSignoffBlock}
  </td></tr>

  <!-- FOOTER -->
  <tr><td align="center" style="border-top:1px solid #e8ecf0;padding-top:22px;">
    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#2D3748;text-transform:uppercase;letter-spacing:2.5px;">
      NAIROBI &nbsp;&middot;&nbsp; KENYA
    </span>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────
//  DECLINED EMAIL TEMPLATE
// ─────────────────────────────────────────────────
function buildDeclinedEmail(name: string): string {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Muncheez — We Understand</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse!important;}
body{margin:0!important;padding:0!important;width:100%!important;background-color:#ffffff;}
@media screen and (max-width:620px){
  .email-wrap{width:100%!important;}
  .monogram{font-size:26px!important;}
  .salutation{font-size:19px!important;}
  .body-cell{width:94%!important;}
  .exec-col{display:block!important;width:100%!important;text-align:center!important;padding:10px 0!important;border:none!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:56px 16px 64px 16px;">
<table class="email-wrap" role="presentation" width="560" cellpadding="0" cellspacing="0" border="0">

  <!-- MONOGRAM -->
  <tr><td align="center" style="padding-bottom:6px;">
    <span class="monogram" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:32px;font-weight:700;color:#0A192F;letter-spacing:-0.5px;line-height:1;">
      Muncheez<span style="color:#0066CC;">.</span>
    </span>
  </td></tr>
  <tr><td align="center" style="padding-bottom:30px;">
    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#0066CC;text-transform:uppercase;letter-spacing:2.5px;">
      A Note of Acknowledgement
    </span>
  </td></tr>

  <!-- Accent dot -->
  <tr><td align="center" style="padding-bottom:34px;">
    <span style="display:inline-block;width:5px;height:5px;background-color:#0A192F;border-radius:50%;font-size:0;line-height:0;">&nbsp;</span>
  </td></tr>

  <!-- SALUTATION -->
  <tr><td align="center" style="padding-bottom:30px;">
    <span class="salutation" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#0A192F;letter-spacing:-0.2px;line-height:1.2;">
      Dear ${name},
    </span>
  </td></tr>

  <!-- BODY -->
  <tr><td align="center">
    <table class="body-cell" role="presentation" width="88%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center">
        <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#2D3748;line-height:1.85;margin:0 0 18px 0;text-align:center;">
          We have noted your response. We understand that calendars are demanding, and we appreciate that you took a moment to let us know.
        </p>
        <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#2D3748;line-height:1.85;margin:0;text-align:center;">
          This is only the beginning of what we are building. You will be among the first to know when the next chapter opens.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="height:48px;">&nbsp;</td></tr>

  <!-- SIGN-OFF -->
  <tr><td align="center" style="padding-bottom:20px;">
    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#2D3748;line-height:1.6;">With gratitude,</span>
  </td></tr>

  <!-- EXECUTIVE FOUNDERS BLOCK -->
  <tr><td align="center" style="padding-bottom:48px;">
    ${execSignoffBlock}
  </td></tr>

  <!-- FOOTER -->
  <tr><td align="center" style="border-top:1px solid #e8ecf0;padding-top:22px;">
    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:8.5px;font-weight:700;color:#2D3748;text-transform:uppercase;letter-spacing:2.5px;">
      NAIROBI &nbsp;&middot;&nbsp; KENYA
    </span>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────
//  EDGE FUNCTION HANDLER
// ─────────────────────────────────────────────────
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { full_name, email, status, plus_ones, event_date } = body.record || body;

        const isAttending = status === "attending";
        const name = full_name || "Guest";

        const eventDate = event_date && event_date !== "To Be Confirmed"
            ? event_date
            : "Date & Time — To Be Confirmed";

        const guestLine = isAttending && plus_ones && parseInt(plus_ones) > 0
            ? `<tr><td align="center" style="padding-top:6px;">
                    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#2D3748;">
                        Registered for <strong>${parseInt(plus_ones) + 1} attendees</strong> &nbsp;&middot;&nbsp; you + ${plus_ones} guest${parseInt(plus_ones) > 1 ? 's' : ''}
                    </span>
               </td></tr>`
            : "";

        const html = isAttending
            ? buildConfirmedEmail(name, eventDate, guestLine)
            : buildDeclinedEmail(name);

        const subject = isAttending
            ? `You're confirmed — Muncheez Online Launch & Platform Demo`
            : `We appreciate your response — Muncheez`;

        if (RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "Muncheez Technologies <events@muncheez.com>",
                    to: [email],
                    subject,
                    html,
                }),
            });
        }

        return new Response(JSON.stringify({ success: true, sent: subject }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
