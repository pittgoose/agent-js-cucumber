Feature: Running Cucumber with Protractor
    As a user of Protractor
    I should be able to use Cucumber
    In order to run my E2E tests

    Scenario Outline: Protractor and Cucumber Test
       
        Given I go to "https://angularjs.org/"
        When I click the add button
        Then i see:
        |<weight>|<energy>|
        Examples:  Rainbow colours
        | weight | energy |
        | x1 | x2 |
        |y1|y1|
        Examples: Only passing
        | weight | energy |
        | x1 | x2 |
        |y1|y1|


    Scenario: Adition Test
        Given I go to "https://angularjs.org/"
        Then I should receive an email with:
        """
        Dear bozo,

        Please click this link to reset your password
        """
   