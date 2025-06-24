// locales/en-US.ts
export default {
    welcome: 'Welcome to my Nuxt 3 App!',
    nav: {
      networks: 'Networks',
      libraries: 'Libraries'
    },
    page: {
      networks: {
        title: 'Networks',
      }
    },
    actions: {
      actions: "Actions",
      create: "Create",
      createNetwork: "Create Network",
      edit: "Edit",
      export: "Export",
      delete: "Delete",
      cancel: "Cancel",
      saveChanges: "Save Changes",
      confirmDeletion: "Confirm Deletion",
      importNetwork: "Import Network"
    },
    network: {
      title: "Optical Networks",
      name: "Name",
      id: "ID",
      created: "Created",
      updated: "Updated",
      editTitle: "Edit Network",
      createTitle: "Create New Network",
      namePlaceholder: "Enter network name",
      noNetworks: "No networks found. Create one!"
    },
    validation: {
      networkNameRequired: "Please enter a network name",
      correctErrors: "Please correct the errors in the form"
    },
    messages: {
      networkCreated: "Network created successfully!",
      networkUpdated: "Network updated successfully!",
      networkDeleted: "Network deleted successfully.",
      deletionCanceled: "Deletion canceled.",
      unexpectedError: "An unexpected error occurred.",
      importingNetwork: "Importing network...",
      importFailed: "Failed to start import process.",
      deleteNetworkConfirm: "Are you sure you want to delete the network \"{name}\"? This action cannot be undone."
    }
  }