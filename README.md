# 1Remind App

## Developer Notes

### Terminology

The word event, eventsModel, eventID, etc are heavily used in the code for variable and attribute names.
In this codebase this term is primarily being used to to refer to Calendar Event, which is defined as a 
"scheduled activity or occurence on a calendar." Take care not to confuse it with the standard Computer 
Scinece definition of term 'event', which defines it as "is a detectable occurrence or change in the 
system's state". Doing so will cause you to struggle to comprehend the code comments and/or behavior.

### Frameworks Used

#### Vuetify
https://vuetifyjs.com/en/

Standard UI Component framework is being used for several nicely defined standard set of UI widgets.

### Build Tools

#### Google Clasp
NPM google clasp module is used to push/pull files to Google AppScript (GAS) for local IDE development. 
A file/folder tree structure is preferred for better project organization in GIT and local development. 
However google only maintains a flattend file structure. Clasp nicely handles flattening and expanding 
files when doing push/pull operations.

#### Visual Studio Code (IDE)
VS Code is used as the primary IDE. 

**Extensions**

The Vue, Vutor and E6 HTML String VS Code extensions are used for syntax Highlighting.

The use of the E6 HTML string plugin neccesitated  inserting /* html */ comment tags in JS code files to activate the syntax 
higlighting. This is being used to properly highlight HTML for the vue code template attribute defined as a multi-line string
in the compponent object definitions.