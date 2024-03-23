-   implement throwable interface for channels much like signals.
-   think about how to address rebindings of moments. once their called, their dead. so when the when calls again, it wont rebind i dont think.
-   how to handle erros in an effect? should there be an implicit signal for the runtime of a signal?
    -   should the `when` have a internal channel for when itself gets updated?

Contributing to an open-source project like Corset typically involves the following steps:

Fork the Repository: The first step is to create a fork of the Corset repository on GitHub. This creates a copy of the repository under your own GitHub account, allowing you to make changes without affecting the original project.

Clone the Repository: After forking, you'll need to clone the repository to your local machine. This allows you to edit the files locally. You can do this by running git clone https://github.com/<your-username>/corset.git in your terminal.

Create a New Branch: It's a good practice to create a new branch for each set of changes you make. This keeps your changes organized and makes it easier to incorporate them into the main project later. You can create a new branch with git checkout -b <branch-name>.

Make Your Changes: Now you're ready to make your changes. You can open the project in your favorite code editor and start coding. Be sure to follow the project's coding standards and conventions.

Commit Your Changes: After making your changes, you'll need to commit them to your local repository. You can do this with git add . to stage all changes, followed by git commit -m "<commit-message>" to commit them.

Push Your Changes: Once you've committed your changes, you'll need to push them to your forked repository on GitHub. You can do this with git push origin <branch-name>.

Submit a Pull Request: Finally, you can submit a pull request on GitHub. This notifies the maintainers of the Corset project that you've made some changes and would like them to review and possibly incorporate them into the main project.

Before you start contributing, it's a good idea to check if the project has a CONTRIBUTING.md file or similar document. This file typically contains specific instructions for contributing to the project, including coding standards, how to submit pull requests, etc. If Corset doesn't have such a document, you could consider reaching out to the maintainers to ask about their preferred contribution process.

V
