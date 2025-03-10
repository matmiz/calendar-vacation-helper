const API_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

async function getAccessToken() {
  // await chrome.identity.clearAllCachedAuthTokens();
  const tokenData = await chrome.identity.getAuthToken({ interactive: true });
  if (chrome.runtime.lastError) {
    throw chrome.runtime.lastError;
  } 
  return tokenData.token
}


interface CalendarEvent {
  summary: string;
  start: {
    date: string;
    timeZone: string;
  };
  end: {
    date: string;
    timeZone: string;
  };
  reminders: {
    useDefault: boolean,
    overrides: Array<object>
  }
}

interface EventDetails {
  requesterName: string;
  vacationDates: string;
}

    // Convert dates from "MMM DD, YYYY" to "YYYY-MM-DD" format
const formatDate = (dateStr: string) => {
    const [month, day, year] = dateStr.replace(',', '').split(' ');
    const monthNum = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;
    const paddedMonth = monthNum.toString().padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  };

// Function to add an event
async function addEventToCalendar(eventDetails: EventDetails): Promise<any> {
  const { requesterName, vacationDates } = eventDetails;
  const [startDate, endDate] = vacationDates.split(' – ');
  const token = await getAccessToken();
  
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  const event: CalendarEvent = {
    summary: `${requesterName} is OOO`,
    start: {
      date: formattedStartDate,
      timeZone: 'Asia/Jerusalem'
    },
    end: {
      date: formattedEndDate,
      timeZone: 'Asia/Jerusalem'
    },
    reminders: {
      useDefault: false,
      overrides: [],
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  const data = await response.json();
  console.log('data:', data)
  if(data?.error) throw new Error(data.error.message)
  return data;
}

interface RequestMessage {
  action: 'authenticate' | 'addToCalendar';
  data: EventDetails
}

chrome.runtime.onMessage.addListener(
  async (
    request: RequestMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    try {
      const { action, data } = request;
      switch (action) {
        case 'authenticate':
          console.log('auth')
          break;
        case 'addToCalendar':
          const response = await addEventToCalendar(data);
          console.log('response:' , response);
          sendResponse({ success: !!response });
          break;
      }
    }
    catch (error) {
      console.error('Authentication error:', error);
      sendResponse({ error: chrome.runtime.lastError?.message || 'Authentication failed' });
    }

    return true;
  }
);