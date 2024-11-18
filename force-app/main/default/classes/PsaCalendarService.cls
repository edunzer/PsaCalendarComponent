public with sharing class PsaCalendarService {
    @AuraEnabled
    public static List<pse__Assignment__c> fetchAllAssignments() {
        try {
            System.debug('Fetching assignments from pse__Assignment__c');
            List<pse__Assignment__c> assignments = [
                SELECT Id, Name, pse__Start_Date__c, pse__End_date__c
                FROM pse__Assignment__c
                WHERE pse__Start_Date__c != null AND pse__End_Date__c != null AND pse__Project__r.Name = 'Global Time Off Project'
                LIMIT 1000
            ];
            for (pse__Assignment__c assignment : assignments) {
                System.debug('Assignment: ' + assignment.Name + ', Start Date: ' + assignment.pse__Start_Date__c + ', End Date: ' + assignment.pse__End_date__c);
            }
            return assignments;
        } catch (Exception e) {
            System.debug('Error while fetching assignments: ' + e.getMessage());
            throw new AuraHandledException('Unable to fetch assignments. Please contact admin.');
        }
    }
}
