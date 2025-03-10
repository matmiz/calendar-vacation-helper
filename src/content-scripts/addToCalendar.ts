import '../styles/content.css'

interface EventDetails {
  requesterName: string;
  vacationDates: string;
}

async function addToCalendar(eventDetails: EventDetails) {
  try {
    chrome.runtime.sendMessage({ action: 'addToCalendar', data: eventDetails }, () => {
        console.log('added successfully:');
        alert(`Added event for ${eventDetails.requesterName} at ${eventDetails.vacationDates}`)
    });
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

const observeGmail = () => {
  try{
    if(location.host !== 'mail.google.com') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const subject = document.querySelector('h2.hP');
          // Check if this email matches your criteria
        if (subject?.textContent?.includes('Your attention is needed on a request')) {
          // Find the email body container
          const emailBody = document.querySelector('.ii.gt');
          if (emailBody && !emailBody.querySelector('.custom-action-button')) {
            const button = document.createElement('button');
            button.className = 'custom-action-button';
            button.textContent = 'Add to your calendar';
            
            button.onclick = () => {
              const emailContent = emailBody.textContent || '';
              
              // Extract requester name - look for literal "/n"
              const requesterMatch = emailContent.match(/Requester(.*)(\/n|)/)
              const requesterName = requesterMatch ? requesterMatch[1].trim().replace(': ','').replace(/ .*/,'') : '';
              console.log('REQUESTER:', requesterName)
              // Extract vacation dates - look for literal "/n"
              const datesMatch = emailContent.match(/(IL Vacation|UKR Vacation|Birthday Leave) – (.*)(\/n|)/);
              const vacationDates = datesMatch ? datesMatch[2].trim() : '';
              console.log('DATES:', vacationDates);
              const eventDetails: EventDetails = {
                requesterName,
                vacationDates
              };
              
              console.log('Extracted details:', eventDetails);
              addToCalendar(eventDetails);
            };
            
            emailBody.insertBefore(button, emailBody.firstChild);
          }
        }
      });
    });
  
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
  }
  catch(error) {
    console.error('Error in observe Gmail:', error)
  }
};

export default observeGmail; 