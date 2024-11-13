import Author from '../models/author';
import { getAuthorList, showAllAuthors } from '../pages/authors';
import { Response } from 'express';
import * as AuthorsModule from '../pages/authors';

describe('getAuthorList', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return "No authors found" when no authors are present', async () => {
        Author.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        const result = await getAuthorList();
        expect(result).toEqual([]);
    });

    it('should handle authors with missing family_name', async () => {
        const mockAuthors = [
            { first_name: 'Jane', family_name: null, date_of_birth: '1775-12-16', date_of_death: '1817-07-18' },
            { first_name: 'Mark', family_name: 'Twain', date_of_birth: '1835-11-30', date_of_death: '1910-04-21' }
        ];
        Author.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAuthors)
        });

        const result = await getAuthorList();
        const expected = ['Jane : 1775 - 1817', 'Twain, Mark : 1835 - 1910'];
        expect(result).toEqual(expected);
    });

    it('should handle database errors gracefully', async () => {
        Author.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        const result = await getAuthorList();
        expect(result).toEqual([]);
    });

    it('should fetch and format the authors list correctly', async () => {
        // Define the sorted authors list as we expect it to be returned by the database
        const sortedAuthors = [
            {
                first_name: 'Jane',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: new Date('1835-11-30'),
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: new Date('1812-02-07'),
                date_of_death: new Date('1870-06-09')
            }
        ];

        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Check if the result matches the expected sorted output
        const expectedAuthors = [
            'Austen, Jane : 1775 - 1817',
            'Ghosh, Amitav : 1835 - 1910',
            'Tagore, Rabindranath : 1812 - 1870'
        ];
        expect(result).toEqual(expectedAuthors);

        // Verify that `.sort()` was called with the correct parameters
        expect(mockFind().sort).toHaveBeenCalledWith([['family_name', 'ascending']]);

    });

    it('should format fullname as empty string if first name is absent', async () => {
        // Define the sorted authors list as we expect it to be returned by the database
        const sortedAuthors = [
            {
                first_name: '',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: new Date('1835-11-30'),
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: new Date('1812-02-07'),
                date_of_death: new Date('1870-06-09')
            }
        ];

        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Check if the result matches the expected sorted output
        const expectedAuthors = [
            ' : 1775 - 1817',
            'Ghosh, Amitav : 1835 - 1910',
            'Tagore, Rabindranath : 1812 - 1870'
        ];
        expect(result).toEqual(expectedAuthors);

        // Verify that `.sort()` was called with the correct parameters
        expect(mockFind().sort).toHaveBeenCalledWith([['family_name', 'ascending']]);

    });

    it('should return an empty array when an error occurs', async () => {
        // Arrange: Mock the Author.find() method to throw an error
        Author.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Verify the result is an empty array
        expect(result).toEqual([]);
    });
});

describe('showAllAuthors', () => {
    let res: Partial<Response>;

    beforeEach(() => {
        // Create a mock Response object
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Restore original implementations after each test
    });

    it('should send the list of authors when authors are found', async () => {
        // Mock the getAuthorList function to return a list of authors
        const mockAuthors = ['Author 1 : 1900 - 1950', 'Author 2 : 1920 - 1980'];
        jest.spyOn(AuthorsModule, 'getAuthorList').mockResolvedValue(mockAuthors);

        // Call the function under test
        await showAllAuthors(res as Response);

        // Assert that `res.send` is called with the correct data
        expect(res.send).toHaveBeenCalledWith(mockAuthors);
    });

    it('should send "No authors found" when no authors are present', async () => {
        // Mock the getAuthorList function to return an empty array
        jest.spyOn(AuthorsModule, 'getAuthorList').mockResolvedValue([]);

        // Call the function under test
        await showAllAuthors(res as Response);

        // Assert that `res.send` is called with 'No authors found'
        expect(res.send).toHaveBeenCalledWith('No authors found');
    });

    it('should handle errors gracefully and send "No authors found"', async () => {
        // Mock the getAuthorList function to throw an error
        jest.spyOn(AuthorsModule, 'getAuthorList').mockRejectedValue(new Error('Database error'));

        // Call the function under test
        await showAllAuthors(res as Response);

        // Assert that `res.send` is called with 'No authors found'
        expect(res.send).toHaveBeenCalledWith('No authors found');
    });
});